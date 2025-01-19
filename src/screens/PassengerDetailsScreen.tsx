import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useMutation } from '@tanstack/react-query'
import DateTimePicker from '@react-native-community/datetimepicker'
import { flightService, BookingRequest } from '@/services/flights/FlightService'
import { Button } from '@/components/ui/Button'
import { colors, spacing, typography } from '@/theme'
import { handleApiError } from '@/services/api/errorHandler'

type Props = NativeStackScreenProps<RootStackParamList, 'PassengerDetails'>

interface PassengerForm {
  firstName: string
  lastName: string
  dateOfBirth: string
  passportNumber: string
}

export const PassengerDetailsScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { flight } = route.params
  const [passengers, setPassengers] = useState<PassengerForm[]>([
    {
      firstName: '',
      lastName: '',
      dateOfBirth: new Date().toISOString(),
      passportNumber: '',
    },
  ])
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0)

  const bookingMutation = useMutation({
    mutationFn: (bookingRequest: BookingRequest) =>
      flightService.bookFlight(bookingRequest),
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const updatedPassengers = [...passengers]
      updatedPassengers[currentPassengerIndex] = {
        ...updatedPassengers[currentPassengerIndex],
        dateOfBirth: selectedDate.toISOString(),
      }
      setPassengers(updatedPassengers)
    }
  }

  const updatePassenger = (index: number, field: keyof PassengerForm, value: string) => {
    const updatedPassengers = [...passengers]
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    }
    setPassengers(updatedPassengers)
  }

  const handleSubmit = () => {
    // Validate all fields
    const isPassengersValid = passengers.every(
      (p) => p.firstName && p.lastName && p.dateOfBirth && p.passportNumber
    )
    const isContactValid = contactInfo.email && contactInfo.phone

    if (!isPassengersValid || !isContactValid) {
      Alert.alert('Missing Information', 'Please fill in all required fields')
      return
    }

    const bookingRequest: BookingRequest = {
      flightId: flight.id,
      passengers: passengers.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        passportNumber: p.passportNumber,
      })),
      contactEmail: contactInfo.email,
      contactPhone: contactInfo.phone,
    }

    bookingMutation.mutate(bookingRequest)
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
        {passengers.map((passenger, index) => (
          <View
            key={index}
            style={styles.passengerForm}
            accessible={true}
            accessibilityLabel={`Passenger ${index + 1} details`}
          >
            <Text style={styles.passengerTitle}>Passenger {index + 1}</Text>
            
            <TextInput
              style={styles.input}
              value={passenger.firstName}
              onChangeText={(text) => updatePassenger(index, 'firstName', text)}
              placeholder="First Name"
              accessibilityLabel="First Name"
              accessibilityHint="Enter passenger's first name"
            />

            <TextInput
              style={styles.input}
              value={passenger.lastName}
              onChangeText={(text) => updatePassenger(index, 'lastName', text)}
              placeholder="Last Name"
              accessibilityLabel="Last Name"
              accessibilityHint="Enter passenger's last name"
            />

            <Button
              onPress={() => {
                setCurrentPassengerIndex(index)
                setShowDatePicker(true)
              }}
              title={`Date of Birth: ${new Date(
                passenger.dateOfBirth
              ).toLocaleDateString()}`}
              accessibilityLabel="Select date of birth"
              accessibilityHint="Double tap to choose passenger's date of birth"
            />

            <TextInput
              style={styles.input}
              value={passenger.passportNumber}
              onChangeText={(text) => updatePassenger(index, 'passportNumber', text)}
              placeholder="Passport Number"
              accessibilityLabel="Passport Number"
              accessibilityHint="Enter passenger's passport number"
            />
          </View>
        ))}

        <View
          style={styles.contactForm}
          accessible={true}
          accessibilityLabel="Contact information"
        >
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TextInput
            style={styles.input}
            value={contactInfo.email}
            onChangeText={(text) =>
              setContactInfo((prev) => ({ ...prev, email: text }))
            }
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email"
            accessibilityHint="Enter contact email address"
          />

          <TextInput
            style={styles.input}
            value={contactInfo.phone}
            onChangeText={(text) =>
              setContactInfo((prev) => ({ ...prev, phone: text }))
            }
            placeholder="Phone Number"
            keyboardType="phone-pad"
            accessibilityLabel="Phone Number"
            accessibilityHint="Enter contact phone number"
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(passengers[currentPassengerIndex].dateOfBirth)}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <Button
          onPress={handleSubmit}
          title="Book Flight"
          loading={bookingMutation.isLoading}
          style={styles.submitButton}
          accessibilityLabel="Book flight button"
          accessibilityHint="Double tap to complete flight booking"
        />
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
  passengerForm: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
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
  passengerTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  contactForm: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
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
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginVertical: spacing.xl,
  },
})
