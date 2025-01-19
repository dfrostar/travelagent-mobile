import { ethers } from 'ethers'
import TravelBookingABI from './contracts/TravelBooking.json'
import { encrypt, decrypt } from '@/utils/encryption'
import { create } from 'ipfs-http-client'
import * as Sentry from '@sentry/react-native'

export interface BlockchainConfig {
  contractAddress: string
  providerUrl: string
  ipfsUrl: string
}

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider
  private contract: ethers.Contract
  private ipfsClient: any
  private signer: ethers.Wallet | null = null

  constructor(private config: BlockchainConfig) {
    this.provider = new ethers.providers.JsonRpcProvider(config.providerUrl)
    this.contract = new ethers.Contract(
      config.contractAddress,
      TravelBookingABI,
      this.provider
    )
    this.ipfsClient = create({ url: config.ipfsUrl })
  }

  async connectWallet(privateKey: string) {
    try {
      this.signer = new ethers.Wallet(privateKey, this.provider)
      this.contract = this.contract.connect(this.signer)
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'connectWallet' },
      })
      throw new Error('Failed to connect wallet')
    }
  }

  async createFlight(flightData: {
    flightNumber: string
    airline: string
    departureAirport: string
    arrivalAirport: string
    departureTime: number
    price: number
  }) {
    try {
      if (!this.signer) throw new Error('Wallet not connected')

      const tx = await this.contract.createFlight(
        flightData.flightNumber,
        flightData.airline,
        flightData.departureAirport,
        flightData.arrivalAirport,
        flightData.departureTime,
        ethers.utils.parseEther(flightData.price.toString())
      )

      const receipt = await tx.wait()
      const event = receipt.events?.find(
        (e: any) => e.event === 'FlightCreated'
      )
      return event?.args?.flightId.toString()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'createFlight' },
        extra: { flightData },
      })
      throw new Error('Failed to create flight on blockchain')
    }
  }

  async createBooking(
    flightId: string,
    passengerData: any,
    price: number
  ) {
    try {
      if (!this.signer) throw new Error('Wallet not connected')

      // Encrypt passenger data
      const encryptedData = await encrypt(JSON.stringify(passengerData))

      // Store encrypted data on IPFS
      const { path } = await this.ipfsClient.add(JSON.stringify(encryptedData))

      const tx = await this.contract.createBooking(flightId, path, {
        value: ethers.utils.parseEther(price.toString()),
      })

      const receipt = await tx.wait()
      const event = receipt.events?.find(
        (e: any) => e.event === 'BookingCreated'
      )
      return event?.args?.bookingId.toString()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'createBooking' },
        extra: { flightId, price },
      })
      throw new Error('Failed to create booking on blockchain')
    }
  }

  async updateBookingStatus(
    bookingId: string,
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
  ) {
    try {
      if (!this.signer) throw new Error('Wallet not connected')

      const statusMap = {
        Pending: 0,
        Confirmed: 1,
        Cancelled: 2,
        Completed: 3,
      }

      const tx = await this.contract.updateBookingStatus(
        bookingId,
        statusMap[status]
      )
      await tx.wait()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'updateBookingStatus' },
        extra: { bookingId, status },
      })
      throw new Error('Failed to update booking status')
    }
  }

  async getFlightDetails(flightId: string) {
    try {
      const flight = await this.contract.getFlightDetails(flightId)
      return {
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        departureAirport: flight.departureAirport,
        arrivalAirport: flight.arrivalAirport,
        departureTime: new Date(flight.departureTime.toNumber() * 1000),
        price: ethers.utils.formatEther(flight.price),
        isAvailable: flight.isAvailable,
        agent: flight.agent,
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'getFlightDetails' },
        extra: { flightId },
      })
      throw new Error('Failed to fetch flight details')
    }
  }

  async getBookingDetails(bookingId: string) {
    try {
      const booking = await this.contract.getBookingDetails(bookingId)
      
      // Fetch and decrypt passenger details from IPFS
      const ipfsData = await this.ipfsClient.cat(booking.passengerDetails)
      const encryptedData = JSON.parse(ipfsData.toString())
      const passengerDetails = JSON.parse(await decrypt(encryptedData))

      return {
        flightId: booking.flightId.toString(),
        passenger: booking.passenger,
        passengerDetails,
        status: ['Pending', 'Confirmed', 'Cancelled', 'Completed'][
          booking.status
        ],
        timestamp: new Date(booking.timestamp.toNumber() * 1000),
        agent: booking.agent,
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'BlockchainService', method: 'getBookingDetails' },
        extra: { bookingId },
      })
      throw new Error('Failed to fetch booking details')
    }
  }
}

export const blockchainService = new BlockchainService({
  contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS!,
  providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL!,
  ipfsUrl: process.env.IPFS_URL!,
})
