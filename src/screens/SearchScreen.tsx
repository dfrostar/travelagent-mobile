import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Alert,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useTripSuggestions } from '@/services/api/queries'
import { SearchInput } from '@/components/ui/SearchInput'
import { TripCard } from '@/components/ui/TripCard'
import TravelAssistant from '@/components/ai/TravelAssistant'
import { colors, spacing } from '@/theme'
import useAppStore from '@/store/useAppStore'
import { handleApiError } from '@/services/api/errorHandler'

export const SearchScreen: React.FC<NativeStackScreenProps<RootStackParamList, 'Search'>> = ({
  navigation,
}) => {
  const [destination, setDestination] = useState('')
  const { voiceEnabled } = useAppStore()
  const {
    data: suggestions,
    isLoading,
    refetch,
    error,
  } = useTripSuggestions({
    destination,
  })

  const handleSearch = () => {
    if (destination.trim()) {
      refetch()
      // Announce loading state to screen readers
      AccessibilityInfo.announceForAccessibility('Searching for trips...')
    }
  }

  const handleTripSelect = (trip: any) => {
    navigation.navigate('TripDetails', { trip })
  }

  const handleVoiceInput = (text: string) => {
    setDestination(text)
    handleSearch()
  }

  // Handle API errors
  React.useEffect(() => {
    if (error) {
      const { userMessage } = handleApiError(error)
      Alert.alert('Error', userMessage)
      // Announce error to screen readers
      AccessibilityInfo.announceForAccessibility(userMessage)
    }
  }, [error])

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchContainer}>
            <SearchInput
              value={destination}
              onChangeText={setDestination}
              onSubmit={handleSearch}
              onVoicePress={() => {
                if (voiceEnabled) {
                  // Voice interface will be shown
                  AccessibilityInfo.announceForAccessibility(
                    'Voice search activated. Speak your destination.'
                  )
                }
              }}
              voiceEnabled={voiceEnabled}
              isLoading={isLoading}
            />
          </View>

          {voiceEnabled && (
            <View
              style={styles.assistantContainer}
              accessible={true}
              accessibilityLabel="Voice Assistant"
            >
              <TravelAssistant onVoiceInput={handleVoiceInput} />
            </View>
          )}

          {suggestions && suggestions.length > 0 && (
            <View
              style={styles.resultsContainer}
              accessible={true}
              accessibilityLabel={`Found ${suggestions.length} trip suggestions`}
            >
              {suggestions.map((trip) => (
                <TripCard
                  key={trip.id}
                  destination={trip.destination}
                  dates={trip.dates}
                  estimatedCost={trip.estimatedCost}
                  activities={trip.activities}
                  onPress={() => handleTripSelect(trip)}
                  imageUrl={`https://source.unsplash.com/800x600/?${encodeURIComponent(
                    trip.destination
                  )}`}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchContainer: {
    marginTop: spacing.md,
  },
  assistantContainer: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
  },
  resultsContainer: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
  },
})
