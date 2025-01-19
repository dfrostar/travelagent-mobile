import { apiClient } from '../api/queries'
import { database } from '../database'
import * as Sentry from '@sentry/react-native'

export interface FlightSearch {
  departureAirport: string
  arrivalAirport: string
  departureDate: string
  returnDate?: string
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
}

export interface Flight {
  id: string
  airline: string
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  price: number
  availableSeats: number
  cabinClass: string
}

export interface BookingRequest {
  flightId: string
  passengers: {
    firstName: string
    lastName: string
    dateOfBirth: string
    passportNumber?: string
  }[]
  contactEmail: string
  contactPhone: string
}

export interface BookingConfirmation {
  bookingReference: string
  status: 'confirmed' | 'pending' | 'failed'
  totalPrice: number
  paymentLink?: string
}

class FlightService {
  async searchFlights(params: FlightSearch): Promise<Flight[]> {
    try {
      const { data } = await apiClient.get<Flight[]>('/flights/search', {
        params: {
          from: params.departureAirport,
          to: params.arrivalAirport,
          departure: params.departureDate,
          return: params.returnDate,
          passengers: params.passengers,
          class: params.cabinClass,
        },
      })

      // Cache flight search results
      await this.cacheFlightResults(data)

      return data
    } catch (error) {
      Sentry.captureException(error, {
        extra: { params },
        tags: { service: 'FlightService', method: 'searchFlights' },
      })
      throw error
    }
  }

  async bookFlight(request: BookingRequest): Promise<BookingConfirmation> {
    try {
      const { data } = await apiClient.post<BookingConfirmation>(
        '/flights/book',
        request
      )

      // Store booking in local database
      await this.storeBooking(data)

      return data
    } catch (error) {
      Sentry.captureException(error, {
        extra: { request },
        tags: { service: 'FlightService', method: 'bookFlight' },
      })
      throw error
    }
  }

  async getBookingStatus(bookingReference: string): Promise<BookingConfirmation> {
    try {
      const { data } = await apiClient.get<BookingConfirmation>(
        `/flights/booking/${bookingReference}`
      )
      return data
    } catch (error) {
      Sentry.captureException(error, {
        extra: { bookingReference },
        tags: { service: 'FlightService', method: 'getBookingStatus' },
      })
      throw error
    }
  }

  private async cacheFlightResults(flights: Flight[]): Promise<void> {
    try {
      const flightsCollection = database.get('flights')
      await database.write(async () => {
        for (const flight of flights) {
          await flightsCollection.create((record) => {
            record.airline = flight.airline
            record.flight_number = flight.flightNumber
            record.departure_airport = flight.departureAirport
            record.arrival_airport = flight.arrivalAirport
            record.departure_time = flight.departureTime
            record.arrival_time = flight.arrivalTime
            record.price = flight.price
            record.synced = true
          })
        }
      })
    } catch (error) {
      console.error('Failed to cache flight results:', error)
    }
  }

  private async storeBooking(booking: BookingConfirmation): Promise<void> {
    try {
      const flightsCollection = database.get('flights')
      await database.write(async () => {
        await flightsCollection.create((record) => {
          record.booking_reference = booking.bookingReference
          record.booking_status = booking.status
          record.synced = true
        })
      })
    } catch (error) {
      console.error('Failed to store booking:', error)
    }
  }
}

export const flightService = new FlightService()
