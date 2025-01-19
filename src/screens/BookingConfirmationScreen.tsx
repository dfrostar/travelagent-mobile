import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { Button } from '@/components/ui/Button'
import { colors, spacing, typography } from '@/theme'
import { Ionicons } from '@expo/vector-icons'

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>

export const BookingConfirmationScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { booking } = route.params

  React.useEffect(() => {
    // Announce booking status to screen readers
    AccessibilityInfo.announceForAccessibility(
      `Booking ${booking.status}. Reference number: ${booking.bookingReference}`
    )
  }, [booking])

  const handlePayment = async () => {
    if (booking.paymentLink) {
      const canOpen = await Linking.canOpenURL(booking.paymentLink)
      if (canOpen) {
        await Linking.openURL(booking.paymentLink)
      } else {
        AccessibilityInfo.announceForAccessibility(
          'Cannot open payment link. Please try again later.'
        )
      }
    }
  }

  const handleViewBookings = () => {
    navigation.navigate('MainTabs', {
      screen: 'Bookings',
    })
  }

  const handleBookAnother = () => {
    navigation.navigate('FlightBooking')
  }

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return colors.success
      case 'pending':
        return colors.warning
      case 'failed':
        return colors.error
      default:
        return colors.textSecondary
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View
        style={styles.card}
        accessible={true}
        accessibilityLabel={`Booking ${booking.status}`}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              booking.status === 'confirmed'
                ? 'checkmark-circle'
                : booking.status === 'pending'
                ? 'time'
                : 'alert-circle'
            }
            size={64}
            color={getStatusColor()}
          />
        </View>

        <Text style={styles.status}>
          Booking {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Text>

        <Text style={styles.reference}>
          Reference: {booking.bookingReference}
        </Text>

        <Text style={styles.price}>
          Total: ${booking.totalPrice.toLocaleString()}
        </Text>

        {booking.status === 'pending' && booking.paymentLink && (
          <Button
            onPress={handlePayment}
            title="Complete Payment"
            style={styles.button}
            accessibilityLabel="Complete payment button"
            accessibilityHint="Double tap to proceed to payment"
          />
        )}

        <View style={styles.buttonGroup}>
          <Button
            onPress={handleViewBookings}
            title="View All Bookings"
            variant="secondary"
            style={styles.button}
            accessibilityLabel="View all bookings button"
            accessibilityHint="Double tap to see all your bookings"
          />

          <Button
            onPress={handleBookAnother}
            title="Book Another Flight"
            style={styles.button}
            accessibilityLabel="Book another flight button"
            accessibilityHint="Double tap to book another flight"
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
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
  iconContainer: {
    marginBottom: spacing.lg,
  },
  status: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  reference: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  price: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    width: '100%',
  },
})
