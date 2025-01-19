import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { Button } from '@/components/ui/Button'
import { useBookTrip } from '@/services/api/queries'
import { colors, spacing, typography, shadows } from '@/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetails'>

export const TripDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { trip } = route.params
  const bookTrip = useBookTrip()

  const handleBooking = async () => {
    try {
      await bookTrip.mutateAsync(trip.id)
      Alert.alert(
        'Success',
        'Your trip has been booked!',
        [
          {
            text: 'View Bookings',
            onPress: () => navigation.navigate('Bookings'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to book trip. Please try again.')
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.destination)}` }}
        style={styles.image}
      />
      
      <View style={styles.content}>
        <Text style={styles.destination}>{trip.destination}</Text>
        
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Dates:</Text>
          <Text style={styles.dateText}>
            {new Date(trip.dates.start).toLocaleDateString()} -{' '}
            {new Date(trip.dates.end).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Cost:</Text>
          <Text style={styles.costText}>
            ${trip.estimatedCost.toLocaleString()}
          </Text>
        </View>

        <View style={styles.activitiesContainer}>
          <Text style={styles.activitiesLabel}>Included Activities:</Text>
          {trip.activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityText}>• {activity}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Book Now"
          onPress={handleBooking}
          loading={bookTrip.isLoading}
          variant="primary"
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: spacing.md,
  },
  destination: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dateContainer: {
    marginBottom: spacing.md,
  },
  dateLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  costContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: shadows,
      android: {
        elevation: 2,
      },
    }),
  },
  costLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  costText: {
    ...typography.h2,
    color: colors.primary,
  },
  activitiesContainer: {
    marginBottom: spacing.xl,
  },
  activitiesLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  activityItem: {
    marginBottom: spacing.xs,
  },
  activityText: {
    ...typography.body,
    color: colors.text,
  },
})
