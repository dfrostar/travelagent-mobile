import { OpenAI } from 'openai'
import { blockchainService } from '../blockchain/BlockchainService'
import { flightService } from '../flights/FlightService'
import * as Sentry from '@sentry/react-native'
import { create as createQueue } from 'async-queue'

interface AgentTask {
  type: 'SEARCH_FLIGHTS' | 'BOOK_FLIGHT' | 'MONITOR_FLIGHT' | 'HANDLE_DISRUPTION'
  parameters: any
  userId: string
}

class AgentService {
  private openai: OpenAI
  private taskQueue: any
  private activeAgents: Map<string, { status: string; task: AgentTask }>

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.taskQueue = createQueue()
    this.activeAgents = new Map()
  }

  async assignTask(task: AgentTask) {
    try {
      return new Promise((resolve, reject) => {
        this.taskQueue.push(async () => {
          try {
            const result = await this.executeTask(task)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      })
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'AgentService', method: 'assignTask' },
        extra: { task },
      })
      throw error
    }
  }

  private async executeTask(task: AgentTask) {
    this.activeAgents.set(task.userId, { status: 'ACTIVE', task })

    try {
      switch (task.type) {
        case 'SEARCH_FLIGHTS':
          return await this.handleFlightSearch(task)
        case 'BOOK_FLIGHT':
          return await this.handleFlightBooking(task)
        case 'MONITOR_FLIGHT':
          return await this.handleFlightMonitoring(task)
        case 'HANDLE_DISRUPTION':
          return await this.handleDisruption(task)
        default:
          throw new Error('Unknown task type')
      }
    } finally {
      this.activeAgents.delete(task.userId)
    }
  }

  private async handleFlightSearch(task: AgentTask) {
    const { preferences, dates, budget } = task.parameters

    // Get AI recommendations based on user preferences
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel agent assistant helping to find optimal flights.',
        },
        {
          role: 'user',
          content: `Find flights matching these preferences: ${JSON.stringify(
            preferences
          )}, dates: ${JSON.stringify(dates)}, budget: ${budget}`,
        },
      ],
    })

    const aiSuggestions = completion.choices[0].message.content
    
    // Search flights using the flight service
    const flights = await flightService.searchFlights({
      ...task.parameters,
      aiSuggestions,
    })

    // Filter and rank flights based on AI recommendations
    const rankedFlights = await this.rankFlightsWithAI(flights, preferences)

    return {
      flights: rankedFlights,
      aiSuggestions,
    }
  }

  private async handleFlightBooking(task: AgentTask) {
    const { flightId, passengerDetails, preferences } = task.parameters

    // Verify flight details on blockchain
    const flightDetails = await blockchainService.getFlightDetails(flightId)

    // Get AI validation of the booking
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel agent assistant validating flight bookings.',
        },
        {
          role: 'user',
          content: `Validate this booking: Flight ${JSON.stringify(
            flightDetails
          )}, Passenger: ${JSON.stringify(
            passengerDetails
          )}, Preferences: ${JSON.stringify(preferences)}`,
        },
      ],
    })

    const aiValidation = completion.choices[0].message.content

    if (!aiValidation.includes('APPROVED')) {
      throw new Error('AI validation failed: ' + aiValidation)
    }

    // Create blockchain booking
    const bookingId = await blockchainService.createBooking(
      flightId,
      passengerDetails,
      flightDetails.price
    )

    return {
      bookingId,
      aiValidation,
      flightDetails,
    }
  }

  private async handleFlightMonitoring(task: AgentTask) {
    const { bookingId } = task.parameters

    // Get booking details from blockchain
    const bookingDetails = await blockchainService.getBookingDetails(bookingId)

    // Monitor flight status and potential disruptions
    const flightStatus = await flightService.getFlightStatus(
      bookingDetails.flightId
    )

    // Get AI analysis of the situation
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel agent assistant monitoring flight status.',
        },
        {
          role: 'user',
          content: `Analyze flight status: ${JSON.stringify(
            flightStatus
          )}, Booking: ${JSON.stringify(bookingDetails)}`,
        },
      ],
    })

    const aiAnalysis = completion.choices[0].message.content

    return {
      status: flightStatus,
      aiAnalysis,
      bookingDetails,
    }
  }

  private async handleDisruption(task: AgentTask) {
    const { bookingId, disruptionType } = task.parameters

    // Get booking details
    const bookingDetails = await blockchainService.getBookingDetails(bookingId)

    // Get AI recommendations for handling the disruption
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel agent assistant handling flight disruptions.',
        },
        {
          role: 'user',
          content: `Handle disruption: Type ${disruptionType}, Booking: ${JSON.stringify(
            bookingDetails
          )}`,
        },
      ],
    })

    const aiRecommendations = completion.choices[0].message.content

    // Search for alternative flights if needed
    const alternativeFlights = await flightService.searchAlternativeFlights(
      bookingDetails.flightId
    )

    return {
      aiRecommendations,
      alternativeFlights,
      bookingDetails,
    }
  }

  private async rankFlightsWithAI(flights: any[], preferences: any) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel agent assistant ranking flights based on preferences.',
        },
        {
          role: 'user',
          content: `Rank these flights: ${JSON.stringify(
            flights
          )} based on preferences: ${JSON.stringify(preferences)}`,
        },
      ],
    })

    const rankings = completion.choices[0].message.content

    // Parse AI rankings and sort flights
    return this.sortFlightsByAIRankings(flights, rankings)
  }

  private sortFlightsByAIRankings(flights: any[], rankings: string) {
    // Implementation of sorting logic based on AI rankings
    return flights.sort((a, b) => {
      const rankA = rankings.indexOf(a.flightNumber)
      const rankB = rankings.indexOf(b.flightNumber)
      return rankA - rankB
    })
  }

  getAgentStatus(userId: string) {
    return this.activeAgents.get(userId)
  }
}

export const agentService = new AgentService()
