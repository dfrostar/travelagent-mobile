import React from 'react'
import { YStack, XStack, Text, Card } from 'tamagui'
import { formatNumber } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

interface RewardCardProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  amount: string
  description: string
  color: string
}

export const RewardCard: React.FC<RewardCardProps> = ({
  title,
  icon,
  amount,
  description,
  color,
}) => {
  return (
    <Card
      bordered
      padded
      animation="bouncy"
      pressStyle={{ scale: 0.97 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${formatNumber(parseFloat(amount))} TRAVL`}
      accessibilityHint={description}
    >
      <XStack space="$3" alignItems="center">
        <Card
          circular
          size="$4"
          backgroundColor={`${color}20`}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name={icon} size={24} color={color} />
        </Card>

        <YStack flex={1} space="$1">
          <Text fontSize="$4" color="$text" fontWeight="500">
            {title}
          </Text>
          <Text fontSize="$3" color="$textMuted">
            {description}
          </Text>
        </YStack>

        <YStack alignItems="flex-end">
          <Text fontSize="$5" color="$text" fontWeight="bold">
            {formatNumber(parseFloat(amount))}
          </Text>
          <Text fontSize="$3" color="$textMuted">
            TRAVL
          </Text>
        </YStack>
      </XStack>
    </Card>
  )
}
