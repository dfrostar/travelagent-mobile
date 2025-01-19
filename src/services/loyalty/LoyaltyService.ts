import { ethers } from 'ethers'
import { blockchainService } from '../blockchain/BlockchainService'
import { walletService } from '../wallet/WalletService'
import * as Sentry from '@sentry/react-native'
import { create } from 'ipfs-http-client'

interface LoyaltyTier {
  id: number
  name: string
  requiredPoints: number
  benefits: string[]
  nftMetadata: {
    name: string
    description: string
    image: string
    attributes: any[]
  }
}

interface LoyaltyActivity {
  type: 'BOOKING' | 'REVIEW' | 'REFERRAL' | 'CHECK_IN'
  points: number
  timestamp: number
  transactionHash?: string
}

class LoyaltyService {
  private readonly LOYALTY_NFT_ADDRESS = process.env.LOYALTY_NFT_ADDRESS!
  private ipfsClient: any

  private readonly LOYALTY_TIERS: LoyaltyTier[] = [
    {
      id: 1,
      name: 'Bronze Traveler',
      requiredPoints: 0,
      benefits: [
        'Basic travel insurance',
        'Standard customer support',
        'Regular booking options',
      ],
      nftMetadata: {
        name: 'Bronze Traveler NFT',
        description: 'Bronze tier membership in Travel Agent loyalty program',
        image: 'ipfs://bronze-nft-image-hash',
        attributes: [
          { trait_type: 'Tier', value: 'Bronze' },
          { trait_type: 'Points Required', value: '0' },
        ],
      },
    },
    {
      id: 2,
      name: 'Silver Explorer',
      requiredPoints: 1000,
      benefits: [
        'Priority customer support',
        'Free flight changes',
        '5% cashback in tokens',
        'Airport lounge access (2x/year)',
      ],
      nftMetadata: {
        name: 'Silver Explorer NFT',
        description: 'Silver tier membership in Travel Agent loyalty program',
        image: 'ipfs://silver-nft-image-hash',
        attributes: [
          { trait_type: 'Tier', value: 'Silver' },
          { trait_type: 'Points Required', value: '1000' },
        ],
      },
    },
    {
      id: 3,
      name: 'Gold Adventurer',
      requiredPoints: 5000,
      benefits: [
        '24/7 concierge service',
        'Free flight changes and cancellations',
        '10% cashback in tokens',
        'Unlimited airport lounge access',
        'Priority check-in',
      ],
      nftMetadata: {
        name: 'Gold Adventurer NFT',
        description: 'Gold tier membership in Travel Agent loyalty program',
        image: 'ipfs://gold-nft-image-hash',
        attributes: [
          { trait_type: 'Tier', value: 'Gold' },
          { trait_type: 'Points Required', value: '5000' },
        ],
      },
    },
    {
      id: 4,
      name: 'Platinum Globetrotter',
      requiredPoints: 10000,
      benefits: [
        'Personal travel assistant',
        'Free companion tickets',
        '15% cashback in tokens',
        'Premium travel insurance',
        'VIP airport services',
        'Exclusive travel packages',
      ],
      nftMetadata: {
        name: 'Platinum Globetrotter NFT',
        description: 'Platinum tier membership in Travel Agent loyalty program',
        image: 'ipfs://platinum-nft-image-hash',
        attributes: [
          { trait_type: 'Tier', value: 'Platinum' },
          { trait_type: 'Points Required', value: '10000' },
        ],
      },
    },
  ]

  constructor() {
    this.ipfsClient = create({ url: process.env.IPFS_URL! })
  }

  async getUserPoints(address: string): Promise<number> {
    try {
      const points = await blockchainService.contract.getLoyaltyPoints(address)
      return points.toNumber()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'getUserPoints' },
        extra: { address },
      })
      throw new Error('Failed to get user points')
    }
  }

  async getUserTier(address: string): Promise<LoyaltyTier> {
    try {
      const points = await this.getUserPoints(address)
      return this.LOYALTY_TIERS.reduce((highest, tier) => {
        if (points >= tier.requiredPoints && tier.requiredPoints >= highest.requiredPoints) {
          return tier
        }
        return highest
      }, this.LOYALTY_TIERS[0])
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'getUserTier' },
        extra: { address },
      })
      throw new Error('Failed to get user tier')
    }
  }

  async awardPoints(
    address: string,
    activity: Omit<LoyaltyActivity, 'timestamp' | 'transactionHash'>
  ): Promise<LoyaltyActivity> {
    try {
      const tx = await blockchainService.contract.awardLoyaltyPoints(
        address,
        activity.points,
        activity.type
      )
      const receipt = await tx.wait()

      const newActivity: LoyaltyActivity = {
        ...activity,
        timestamp: Date.now(),
        transactionHash: receipt.transactionHash,
      }

      // Check if user qualifies for new tier
      const newTier = await this.getUserTier(address)
      const currentTierNFT = await this.getUserTierNFT(address)

      if (newTier.id > currentTierNFT?.id) {
        await this.mintTierNFT(address, newTier)
      }

      return newActivity
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'awardPoints' },
        extra: { address, activity },
      })
      throw new Error('Failed to award points')
    }
  }

  async getUserActivities(address: string): Promise<LoyaltyActivity[]> {
    try {
      const activities = await blockchainService.contract.getLoyaltyActivities(
        address
      )
      return activities.map((activity: any) => ({
        type: activity.activityType,
        points: activity.points.toNumber(),
        timestamp: activity.timestamp.toNumber() * 1000,
        transactionHash: activity.transactionHash,
      }))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'getUserActivities' },
        extra: { address },
      })
      throw new Error('Failed to get user activities')
    }
  }

  async getUserTierNFT(address: string): Promise<LoyaltyTier | null> {
    try {
      const tokenId = await blockchainService.contract.getUserTierNFT(address)
      if (tokenId.isZero()) return null

      const tier = this.LOYALTY_TIERS.find(
        (t) => t.id === tokenId.toNumber()
      )
      return tier || null
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'getUserTierNFT' },
        extra: { address },
      })
      throw new Error('Failed to get user tier NFT')
    }
  }

  private async mintTierNFT(
    address: string,
    tier: LoyaltyTier
  ): Promise<string> {
    try {
      // Upload metadata to IPFS
      const { path: metadataHash } = await this.ipfsClient.add(
        JSON.stringify(tier.nftMetadata)
      )

      // Mint NFT
      const tx = await blockchainService.contract.mintTierNFT(
        address,
        tier.id,
        `ipfs://${metadataHash}`
      )
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'mintTierNFT' },
        extra: { address, tier },
      })
      throw new Error('Failed to mint tier NFT')
    }
  }

  async getPointsForActivity(type: LoyaltyActivity['type']): Promise<number> {
    const pointsMap = {
      BOOKING: 100,
      REVIEW: 50,
      REFERRAL: 200,
      CHECK_IN: 25,
    }
    return pointsMap[type] || 0
  }

  getLoyaltyTiers(): LoyaltyTier[] {
    return this.LOYALTY_TIERS
  }

  async transferPoints(
    fromAddress: string,
    toAddress: string,
    points: number
  ): Promise<string> {
    try {
      const tx = await blockchainService.contract.transferLoyaltyPoints(
        fromAddress,
        toAddress,
        points
      )
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'LoyaltyService', method: 'transferPoints' },
        extra: { fromAddress, toAddress, points },
      })
      throw new Error('Failed to transfer points')
    }
  }
}

export const loyaltyService = new LoyaltyService()
