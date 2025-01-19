import React from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { TripCard } from '@/components/ui/TripCard'
import { colors, spacing, typography, shadows } from '@/theme'
import { apiClient } from '@/services/api/queries'

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>

interface Booking {
  id: string
  trip: {
    id: string
    destination: string
    dates: {
      start: string
      end: string
    }
    estimatedCost: number
    activities: string[]
  }
  status: 'confirmed' | 'pending' | 'cancelled'
  bookingDate: string
}

export const BookingsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    data: bookings,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get<Booking[]>('/bookings')
      return data
    },
  })

  const handleTripPress = (trip: Booking['trip']) => {
    navigation.navigate('TripDetails', { trip })
  }

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingContainer}>
      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.statusText,
            item.status === 'confirmed' && styles.statusConfirmed,
            item.status === 'pending' && styles.statusPending,
            item.status === 'cancelled' && styles.statusCancelled,
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
        <Text style={styles.dateText}>
          Booked on: {new Date(item.bookingDate).toLocaleDateString()}
        </Text>
      </View>
      <TripCard
        destination={item.trip.destination}
        dates={item.trip.dates}
        estimatedCost={item.trip.estimatedCost}
        activities={item.trip.activities}
        onPress={() => handleTripPress(item.trip)}
        imageUrl={`https://source.unsplash.com/800x600/?${encodeURIComponent(
          item.trip.destination
        )}`}
      />
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  bookingContainer: {
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: shadows,
      android: {
        elevation: 4,
      },
    }),
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    color: '#EF6C00',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
