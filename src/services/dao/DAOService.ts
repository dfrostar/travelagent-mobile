import { ethers } from 'ethers'
import { blockchainService } from '../blockchain/BlockchainService'
import { walletService } from '../wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import { create } from 'zustand'

interface Proposal {
  id: string
  title: string
  description: string
  creator: string
  startTime: number
  endTime: number
  status: 'Active' | 'Passed' | 'Failed' | 'Executed'
  forVotes: number
  againstVotes: number
  quorum: number
  actions: ProposalAction[]
}

interface ProposalAction {
  target: string
  value: string
  signature: string
  data: string
}

interface Vote {
  proposalId: string
  voter: string
  support: boolean
  votes: number
  timestamp: number
}

interface DAOState {
  proposals: Proposal[]
  userVotingPower: number
  delegatedVotes: number
  totalSupply: number
  setProposals: (proposals: Proposal[]) => void
  setUserVotingPower: (power: number) => void
  setDelegatedVotes: (votes: number) => void
  setTotalSupply: (supply: number) => void
}

export const useDAOStore = create<DAOState>((set) => ({
  proposals: [],
  userVotingPower: 0,
  delegatedVotes: 0,
  totalSupply: 0,
  setProposals: (proposals) => set({ proposals }),
  setUserVotingPower: (power) => set({ userVotingPower: power }),
  setDelegatedVotes: (votes) => set({ delegatedVotes: votes }),
  setTotalSupply: (supply) => set({ totalSupply: supply }),
}))

class DAOService {
  private readonly DAO_ADDRESS = process.env.DAO_CONTRACT_ADDRESS!
  private readonly GOVERNANCE_TOKEN_ADDRESS = process.env.GOVERNANCE_TOKEN_ADDRESS!

  async createProposal(
    title: string,
    description: string,
    actions: ProposalAction[]
  ): Promise<string> {
    try {
      const tx = await blockchainService.contract.propose(
        actions.map((a) => a.target),
        actions.map((a) => a.value),
        actions.map((a) => a.signature),
        actions.map((a) => a.data),
        title,
        description
      )

      const receipt = await tx.wait()
      const event = receipt.events?.find((e: any) => e.event === 'ProposalCreated')
      return event?.args?.proposalId.toString()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'createProposal' },
        extra: { title, description, actions },
      })
      throw new Error('Failed to create proposal')
    }
  }

  async castVote(
    proposalId: string,
    support: boolean
  ): Promise<string> {
    try {
      const tx = await blockchainService.contract.castVote(proposalId, support)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'castVote' },
        extra: { proposalId, support },
      })
      throw new Error('Failed to cast vote')
    }
  }

  async delegateVotes(delegatee: string): Promise<string> {
    try {
      const tx = await blockchainService.contract.delegate(delegatee)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'delegateVotes' },
        extra: { delegatee },
      })
      throw new Error('Failed to delegate votes')
    }
  }

  async getProposals(): Promise<Proposal[]> {
    try {
      const filter = blockchainService.contract.filters.ProposalCreated()
      const events = await blockchainService.contract.queryFilter(filter)
      
      const proposals = await Promise.all(
        events.map(async (event: any) => {
          const proposal = await blockchainService.contract.proposals(
            event.args.proposalId
          )
          return this.formatProposal(proposal, event.args)
        })
      )

      useDAOStore.getState().setProposals(proposals)
      return proposals
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'getProposals' },
      })
      throw new Error('Failed to get proposals')
    }
  }

  async getUserVotingPower(address: string): Promise<number> {
    try {
      const power = await blockchainService.contract.getVotes(address)
      const powerNumber = parseFloat(ethers.utils.formatEther(power))
      useDAOStore.getState().setUserVotingPower(powerNumber)
      return powerNumber
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'getUserVotingPower' },
        extra: { address },
      })
      throw new Error('Failed to get voting power')
    }
  }

  async getProposalVotes(proposalId: string): Promise<Vote[]> {
    try {
      const filter = blockchainService.contract.filters.VoteCast(null, proposalId)
      const events = await blockchainService.contract.queryFilter(filter)
      
      return events.map((event: any) => ({
        proposalId,
        voter: event.args.voter,
        support: event.args.support,
        votes: parseFloat(ethers.utils.formatEther(event.args.votes)),
        timestamp: event.args.timestamp.toNumber(),
      }))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'getProposalVotes' },
        extra: { proposalId },
      })
      throw new Error('Failed to get proposal votes')
    }
  }

  async executeProposal(proposalId: string): Promise<string> {
    try {
      const tx = await blockchainService.contract.execute(proposalId)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'executeProposal' },
        extra: { proposalId },
      })
      throw new Error('Failed to execute proposal')
    }
  }

  async queueProposal(proposalId: string): Promise<string> {
    try {
      const tx = await blockchainService.contract.queue(proposalId)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'DAOService', method: 'queueProposal' },
        extra: { proposalId },
      })
      throw new Error('Failed to queue proposal')
    }
  }

  private formatProposal(proposal: any, args: any): Proposal {
    return {
      id: args.proposalId.toString(),
      title: args.description.split('\n')[0],
      description: args.description.split('\n').slice(1).join('\n'),
      creator: args.proposer,
      startTime: proposal.startBlock.toNumber(),
      endTime: proposal.endBlock.toNumber(),
      status: this.getProposalStatus(proposal.state),
      forVotes: parseFloat(ethers.utils.formatEther(proposal.forVotes)),
      againstVotes: parseFloat(ethers.utils.formatEther(proposal.againstVotes)),
      quorum: parseFloat(ethers.utils.formatEther(proposal.quorumVotes)),
      actions: args.targets.map((target: string, index: number) => ({
        target,
        value: args.values[index].toString(),
        signature: args.signatures[index],
        data: args.calldatas[index],
      })),
    }
  }

  private getProposalStatus(state: number): Proposal['status'] {
    const states = ['Active', 'Failed', 'Passed', 'Executed']
    return states[state] as Proposal['status']
  }
}

export const daoService = new DAOService()
