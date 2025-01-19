import { ethers } from 'ethers'
import { blockchainService } from '../blockchain/BlockchainService'
import { walletService } from '../wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface TokenMetrics {
  marketCap: string
  circulatingSupply: string
  totalStaked: string
  stakingAPR: string
  totalHolders: number
}

interface TokenState {
  balance: string
  stakedBalance: string
  rewards: string
  referralCount: number
  bookingRewards: string
  metrics: TokenMetrics | null
  setBalance: (balance: string) => void
  setStakedBalance: (balance: string) => void
  setRewards: (rewards: string) => void
  setReferralCount: (count: number) => void
  setBookingRewards: (rewards: string) => void
  setMetrics: (metrics: TokenMetrics) => void
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      balance: '0',
      stakedBalance: '0',
      rewards: '0',
      referralCount: 0,
      bookingRewards: '0',
      metrics: null,
      setBalance: (balance) => set({ balance }),
      setStakedBalance: (balance) => set({ stakedBalance }),
      setRewards: (rewards) => set({ rewards }),
      setReferralCount: (count) => set({ referralCount }),
      setBookingRewards: (rewards) => set({ bookingRewards }),
      setMetrics: (metrics) => set({ metrics }),
    }),
    {
      name: 'travl-token-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name)
        },
      },
    }
  )
)

class TravlTokenService {
  private readonly TOKEN_ADDRESS = process.env.TRAVL_TOKEN_ADDRESS!
  private readonly UNISWAP_ROUTER = process.env.UNISWAP_ROUTER_ADDRESS!
  private readonly TOKEN_PAIRS = {
    ETH: process.env.WETH_ADDRESS!,
    USDC: process.env.USDC_ADDRESS!,
    DAI: process.env.DAI_ADDRESS!,
    USDT: process.env.USDT_ADDRESS!,
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await blockchainService.contract.balanceOf(address)
      const formattedBalance = ethers.utils.formatEther(balance)
      useTokenStore.getState().setBalance(formattedBalance)
      return formattedBalance
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getBalance' },
        extra: { address },
      })
      throw new Error('Failed to get token balance')
    }
  }

  async getTokenMetrics(): Promise<TokenMetrics> {
    try {
      const [
        totalSupply,
        stakedTotal,
        holders,
        marketCap,
      ] = await Promise.all([
        blockchainService.contract.totalSupply(),
        blockchainService.contract.getTotalStaked(),
        blockchainService.contract.getHolderCount(),
        this.getMarketCap(),
      ])

      const metrics: TokenMetrics = {
        marketCap,
        circulatingSupply: ethers.utils.formatEther(totalSupply),
        totalStaked: ethers.utils.formatEther(stakedTotal),
        stakingAPR: '5.00',
        totalHolders: holders.toNumber(),
      }

      useTokenStore.getState().setMetrics(metrics)
      return metrics
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getTokenMetrics' },
      })
      throw new Error('Failed to get token metrics')
    }
  }

  async getMarketCap(): Promise<string> {
    try {
      const price = await this.getTokenPrice()
      const totalSupply = await blockchainService.contract.totalSupply()
      const marketCap = price * parseFloat(ethers.utils.formatEther(totalSupply))
      return marketCap.toFixed(2)
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getMarketCap' },
      })
      throw new Error('Failed to get market cap')
    }
  }

  async getTokenPrice(): Promise<number> {
    try {
      const path = [this.TOKEN_ADDRESS, this.TOKEN_PAIRS.USDC]
      const amounts = await blockchainService.router.getAmountsOut(
        ethers.utils.parseEther('1'),
        path
      )
      return parseFloat(ethers.utils.formatUnits(amounts[1], 6))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getTokenPrice' },
      })
      throw new Error('Failed to get token price')
    }
  }

  async stake(amount: string): Promise<string> {
    try {
      const tx = await blockchainService.contract.stake(
        ethers.utils.parseEther(amount)
      )
      const receipt = await tx.wait()
      await this.updateUserState(walletService.address!)
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'stake' },
        extra: { amount },
      })
      throw new Error('Failed to stake tokens')
    }
  }

  async unstake(): Promise<string> {
    try {
      const tx = await blockchainService.contract.unstake()
      const receipt = await tx.wait()
      await this.updateUserState(walletService.address!)
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'unstake' },
      })
      throw new Error('Failed to unstake tokens')
    }
  }

  async claimRewards(): Promise<string> {
    try {
      const tx = await blockchainService.contract.claimReward()
      const receipt = await tx.wait()
      await this.updateUserState(walletService.address!)
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'claimRewards' },
      })
      throw new Error('Failed to claim rewards')
    }
  }

  async getStakedBalance(address: string): Promise<string> {
    try {
      const balance = await blockchainService.contract.stakedBalance(address)
      const formattedBalance = ethers.utils.formatEther(balance)
      useTokenStore.getState().setStakedBalance(formattedBalance)
      return formattedBalance
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getStakedBalance' },
        extra: { address },
      })
      throw new Error('Failed to get staked balance')
    }
  }

  async getPendingRewards(address: string): Promise<string> {
    try {
      const rewards = await blockchainService.contract.calculateReward(address)
      const formattedRewards = ethers.utils.formatEther(rewards)
      useTokenStore.getState().setRewards(formattedRewards)
      return formattedRewards
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getPendingRewards' },
        extra: { address },
      })
      throw new Error('Failed to get pending rewards')
    }
  }

  async getReferralCount(address: string): Promise<number> {
    try {
      const referrals = await blockchainService.contract.referrals(address)
      useTokenStore.getState().setReferralCount(referrals.length)
      return referrals.length
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getReferralCount' },
        extra: { address },
      })
      throw new Error('Failed to get referral count')
    }
  }

  async getBookingRewards(address: string): Promise<string> {
    try {
      const rewards = await blockchainService.contract.bookingRewards(address)
      const formattedRewards = ethers.utils.formatEther(rewards)
      useTokenStore.getState().setBookingRewards(formattedRewards)
      return formattedRewards
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'getBookingRewards' },
        extra: { address },
      })
      throw new Error('Failed to get booking rewards')
    }
  }

  async convertPointsToTokens(points: number): Promise<string> {
    try {
      const tx = await blockchainService.contract.convertPointsToTokens(
        walletService.address!,
        points
      )
      const receipt = await tx.wait()
      await this.updateUserState(walletService.address!)
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'convertPointsToTokens' },
        extra: { points },
      })
      throw new Error('Failed to convert points to tokens')
    }
  }

  async transfer(to: string, amount: string): Promise<string> {
    try {
      const tx = await blockchainService.contract.transfer(
        to,
        ethers.utils.parseEther(amount)
      )
      const receipt = await tx.wait()
      await this.updateUserState(walletService.address!)
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TravlTokenService', method: 'transfer' },
        extra: { to, amount },
      })
      throw new Error('Failed to transfer tokens')
    }
  }

  private async updateUserState(address: string) {
    await Promise.all([
      this.getBalance(address),
      this.getStakedBalance(address),
      this.getPendingRewards(address),
      this.getReferralCount(address),
      this.getBookingRewards(address),
      this.getTokenMetrics(),
    ])
  }

  getTokenomics() {
    return {
      name: 'Travel Agent Token',
      symbol: 'TRAVL',
      decimals: 18,
      totalSupply: '100,000,000 TRAVL',
      stakingAPR: '5%',
      bookingRewardRate: '1%',
      referralReward: '1,000 TRAVL',
      pointsToTokenRate: '100:1',
      stakingPeriod: '30 days',
      initialDistribution: {
        community: '40%',
        development: '20%',
        team: '15%',
        marketing: '10%',
        treasury: '10%',
        advisors: '5%',
      },
      vestingSchedule: {
        team: '2 years linear vesting',
        advisors: '1 year linear vesting',
        development: '2 years linear vesting',
      },
    }
  }
}

export const travlTokenService = new TravlTokenService()
