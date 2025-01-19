import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { useTripSuggestions } from '@/services/api/queries'
import { handleApiError } from '@/services/api/errorHandler'
import useAppStore from '@/store/useAppStore'
import { VoiceInterface } from '../VoiceInterface'
import { colors, spacing } from '@/theme'

interface TravelAssistantProps {
  onVoiceInput: (text: string) => void
}

export const TravelAssistant: React.FC<TravelAssistantProps> = ({
  onVoiceInput,
}) => {
  const { voiceEnabled } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: suggestions, isLoading, error } = useTripSuggestions({
    destination: searchQuery,
  })

  const handleVoiceResult = (text: string) => {
    // Process the voice input to extract destination
    const destination = processVoiceInput(text)
    onVoiceInput(destination)
    setSearchQuery(destination)
  }

  const handleError = (error: Error) => {
    Alert.alert('Voice Recognition Error', error.message)
  }

  return (
    <View style={styles.container}>
      {voiceEnabled && (
        <VoiceInterface
          onTranscript={handleVoiceResult}
          onError={handleError}
        />
      )}
      {/* Add your UI components here */}
    </View>
  )
}

// Simple voice input processor
const processVoiceInput = (text: string): string => {
  // Convert to lowercase for easier processing
  const input = text.toLowerCase()
  
  // Common patterns for travel queries
  const patterns = [
    /(?:i want to|i'd like to|let's|can i) (?:go|travel|visit|fly) (?:to) (.+)/i,
    /(?:find|show|search for) (?:trips|flights|travel) (?:to) (.+)/i,
    /(?:take me to) (.+)/i,
    /(.+) (?:vacation|holiday|trip)/i,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  // If no pattern matches, return the whole text
  return text
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
})

export default TravelAssistant
