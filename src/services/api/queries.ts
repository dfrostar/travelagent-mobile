import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '@/config'

// Types
interface TripSearch {
  destination: string
  dates?: {
    start: string
    end: string
  }
  budget?: number
}

interface TripSuggestion {
  id: string
  destination: string
  dates: {
    start: string
    end: string
  }
  estimatedCost: number
  activities: string[]
}

// API client
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Queries
export const useTripSuggestions = (search: TripSearch) => {
  return useQuery({
    queryKey: ['tripSuggestions', search],
    queryFn: async () => {
      const { data } = await apiClient.post<TripSuggestion[]>('/suggestions', search)
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutations
export const useBookTrip = () => {
  return useMutation({
    mutationFn: async (tripId: string) => {
      const { data } = await apiClient.post(`/trips/${tripId}/book`)
      return data
    },
  })
}
