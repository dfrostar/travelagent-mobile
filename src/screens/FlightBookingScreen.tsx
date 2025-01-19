import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useMutation, useQuery } from '@tanstack/react-query'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { flightService, FlightSearch, Flight } from '@/services/flights/FlightService'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { colors, spacing, typography } from '@/theme'
import { handleApiError } from '@/services/api/errorHandler'

type Props = NativeStackScreenProps<RootStackParamList, 'FlightBooking'>

export const FlightBookingScreen: React.FC<Props> = ({ navigation }) => {
  const [searchParams, setSearchParams] = useState<FlightSearch>({
    departureAirport: '',
    arrivalAirport: '',
    departureDate: new Date().toISOString(),
    returnDate: undefined,
    passengers: 1,
    cabinClass: 'economy',
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)

  const { data: flights, isLoading: isSearching } = useQuery({
    queryKey: ['flights', searchParams],
    queryFn: () => flightService.searchFlights(searchParams),
    enabled: Boolean(searchParams.departureAirport && searchParams.arrivalAirport),
  })

  const bookingMutation = useMutation({
    mutationFn: flightService.bookFlight,
    onSuccess: (data) => {
      AccessibilityInfo.announceForAccessibility('Flight booked successfully!')
      navigation.navigate('BookingConfirmation', { booking: data })
    },
    onError: (error) => {
      const { userMessage } = handleApiError(error)
      Alert.alert('Booking Failed', userMessage)
      AccessibilityInfo.announceForAccessibility(`Booking failed: ${userMessage}`)
    },
  })

  const handleSearch = () => {
    if (!searchParams.departureAirport || !searchParams.arrivalAirport) {
      Alert.alert('Please enter both departure and arrival airports')
      return
    }
    AccessibilityInfo.announceForAccessibility('Searching for flights...')
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setSearchParams((prev) => ({
        ...prev,
        departureDate: selectedDate.toISOString(),
      }))
    }
  }

  const handleBook = (flight: Flight) => {
    setSelectedFlight(flight)
    navigation.navigate('PassengerDetails', { flight })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchSection}>
          <SearchInput
            value={searchParams.departureAirport}
            onChangeText={(text) =>
              setSearchParams((prev) => ({ ...prev, departureAirport: text }))
            }
            placeholder="Departure Airport (e.g., JFK)"
            accessibilityLabel="Departure Airport"
            accessibilityHint="Enter the airport you want to depart from"
          />

          <SearchInput
            value={searchParams.arrivalAirport}
            onChangeText={(text) =>
              setSearchParams((prev) => ({ ...prev, arrivalAirport: text }))
            }
            placeholder="Arrival Airport (e.g., LAX)"
            accessibilityLabel="Arrival Airport"
            accessibilityHint="Enter the airport you want to arrive at"
          />

          <Button
            onPress={() => setShowDatePicker(true)}
            title={`Departure: ${new Date(
              searchParams.departureDate
            ).toLocaleDateString()}`}
            accessibilityLabel="Select departure date"
            accessibilityHint="Double tap to choose your departure date"
          />

          {showDatePicker && (
            <DateTimePicker
              value={new Date(searchParams.departureDate)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Passengers</Text>
            <Picker
              selectedValue={searchParams.passengers}
              onValueChange={(value) =>
                setSearchParams((prev) => ({ ...prev, passengers: value }))
              }
              accessibilityLabel="Number of passengers"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <Picker.Item
                  key={num}
                  label={`${num} ${num === 1 ? 'Passenger' : 'Passengers'}`}
                  value={num}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Cabin Class</Text>
            <Picker
              selectedValue={searchParams.cabinClass}
              onValueChange={(value: 'economy' | 'business' | 'first') =>
                setSearchParams((prev) => ({ ...prev, cabinClass: value }))
              }
              accessibilityLabel="Cabin class"
            >
              <Picker.Item label="Economy" value="economy" />
              <Picker.Item label="Business" value="business" />
              <Picker.Item label="First Class" value="first" />
            </Picker>
          </View>

          <Button
            onPress={handleSearch}
            title="Search Flights"
            loading={isSearching}
            disabled={!searchParams.departureAirport || !searchParams.arrivalAirport}
            accessibilityLabel="Search flights button"
            accessibilityHint="Double tap to search for available flights"
          />
        </View>

        {flights && flights.length > 0 && (
          <View
            style={styles.resultsContainer}
            accessible={true}
            accessibilityLabel={`Found ${flights.length} flights`}
          >
            <Text style={styles.resultsTitle}>Available Flights</Text>
            {flights.map((flight) => (
              <View
                key={flight.id}
                style={styles.flightCard}
                accessible={true}
                accessibilityLabel={`Flight ${flight.flightNumber} from ${
                  flight.departureAirport
                } to ${flight.arrivalAirport}, departing at ${new Date(
                  flight.departureTime
                ).toLocaleTimeString()}, price ${flight.price}`}
              >
                <View style={styles.flightInfo}>
                  <Text style={styles.airline}>{flight.airline}</Text>
                  <Text style={styles.flightNumber}>
                    Flight: {flight.flightNumber}
                  </Text>
                  <Text style={styles.time}>
                    {new Date(flight.departureTime).toLocaleTimeString()} -{' '}
                    {new Date(flight.arrivalTime).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.price}>
                    ${flight.price.toLocaleString()}
                  </Text>
                </View>
                <Button
                  onPress={() => handleBook(flight)}
                  title="Select"
                  accessibilityLabel={`Select flight ${flight.flightNumber}`}
                  accessibilityHint="Double tap to select this flight"
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  searchSection: {
    gap: spacing.md,
  },
  pickerContainer: {
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultsContainer: {
    marginTop: spacing.xl,
  },
  resultsTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  flightCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  flightInfo: {
    marginBottom: spacing.md,
  },
  airline: {
    ...typography.h3,
    color: colors.text,
  },
  flightNumber: {
    ...typography.body,
    color: colors.textSecondary,
  },
  time: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.h3,
    color: colors.primary,
    marginTop: spacing.xs,
  },
})
