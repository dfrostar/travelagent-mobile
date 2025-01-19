import create from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  isAuthenticated: boolean
  currentTrip: Trip | null
  voiceEnabled: boolean
  setAuthenticated: (status: boolean) => void
  setCurrentTrip: (trip: Trip | null) => void
  setVoiceEnabled: (enabled: boolean) => void
}

interface Trip {
  id: string
  destination: string
  startDate: string
  endDate: string
  status: 'planning' | 'booked' | 'completed'
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentTrip: null,
      voiceEnabled: false,
      setAuthenticated: (status) => set({ isAuthenticated: status }),
      setCurrentTrip: (trip) => set({ currentTrip: trip }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
    }),
    {
      name: 'app-storage',
    }
  )
)

export default useAppStore
