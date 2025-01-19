import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  AccessibilityInfo,
} from 'react-native'
import { colors, spacing, typography, shadows, borderRadius } from '@/theme'

interface TripCardProps {
  destination: string
  dates: {
    start: string
    end: string
  }
  estimatedCost: number
  activities: string[]
  onPress: () => void
  imageUrl?: string
}

export const TripCard: React.FC<TripCardProps> = ({
  destination,
  dates,
  estimatedCost,
  activities,
  onPress,
  imageUrl,
}) => {
  const formattedDates = `${new Date(dates.start).toLocaleDateString()} - ${new Date(
    dates.end
  ).toLocaleDateString()}`
  
  const formattedCost = estimatedCost.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const accessibilityLabel = `Trip to ${destination}. ${formattedDates}. Estimated cost: ${formattedCost}. Activities include: ${activities.join(
    ', '
  )}`

  return (
    <TouchableOpacity
      style={[styles.container, Platform.select({ ios: shadows, android: {} })]}
      onPress={() => {
        AccessibilityInfo.announceForAccessibility(
          `Selected trip to ${destination}`
        )
        onPress()
      }}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view trip details"
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessible={true}
          accessibilityLabel={`Photo of ${destination}`}
          accessibilityRole="image"
        />
      )}
      <View style={styles.content}>
        <Text
          style={styles.destination}
          accessibilityRole="header"
        >
          {destination}
        </Text>
        <Text style={styles.dates} accessibilityLabel={`Travel dates: ${formattedDates}`}>
          {formattedDates}
        </Text>
        <Text
          style={styles.cost}
          accessibilityLabel={`Estimated cost: ${formattedCost}`}
        >
          {formattedCost}
        </Text>
        <View
          style={styles.activities}
          accessible={true}
          accessibilityLabel={`Activities: ${activities.join(', ')}`}
        >
          {activities.slice(0, 3).map((activity, index) => (
            <Text key={index} style={styles.activity}>
              • {activity}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  image: {
    height: 150,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  destination: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dates: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cost: {
    ...typography.body,
    color: colors.primary,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
    marginBottom: spacing.sm,
  },
  activities: {
    marginTop: spacing.sm,
  },
  activity: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
})
