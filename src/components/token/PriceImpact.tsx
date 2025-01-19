import React from 'react'
import { XStack, Text } from 'tamagui'
import { theme } from '@/theme'

interface PriceImpactProps {
  value: number
}

export const PriceImpact: React.FC<PriceImpactProps> = ({ value }) => {
  const getImpactColor = () => {
    if (value <= 1) return theme.colors.success
    if (value <= 3) return theme.colors.warning
    return theme.colors.error
  }

  const getImpactDescription = () => {
    if (value <= 1) return 'Low impact'
    if (value <= 3) return 'Medium impact'
    return 'High impact'
  }

  return (
    <XStack
      justifyContent="space-between"
      accessibilityLabel={`Price impact: ${value.toFixed(2)}%`}
      accessibilityHint={`${getImpactDescription()} on price`}
    >
      <Text color="$textMuted">Price Impact</Text>
      <Text color={getImpactColor()} fontWeight="500">
        {value.toFixed(2)}% ({getImpactDescription()})
      </Text>
    </XStack>
  )
}
