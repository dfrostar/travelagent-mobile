import React from 'react'
import { YStack, XStack, Text, Card, Button, Input } from 'tamagui'
import { formatNumber } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

interface TokenInputProps {
  value: string
  onChangeText: (text: string) => void
  maxAmount: string
  symbol: string
  disabled?: boolean
  onSelectToken?: () => void
}

export const TokenInput: React.FC<TokenInputProps> = ({
  value,
  onChangeText,
  maxAmount,
  symbol,
  disabled = false,
  onSelectToken,
}) => {
  const handleMaxPress = () => {
    onChangeText(maxAmount)
  }

  const handleChangeText = (text: string) => {
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(text) || text === '') {
      onChangeText(text)
    }
  }

  return (
    <Card
      bordered
      backgroundColor="$backgroundHover"
      padding="$4"
    >
      <YStack space="$2">
        <XStack justifyContent="space-between">
          <Text fontSize="$3" color="$textMuted">
            Amount
          </Text>
          <Text fontSize="$3" color="$textMuted">
            Balance: {formatNumber(parseFloat(maxAmount))}
          </Text>
        </XStack>

        <XStack space="$2" alignItems="center">
          <Input
            flex={1}
            size="$5"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={handleChangeText}
            placeholder="0.00"
            disabled={disabled}
            fontSize="$6"
            textAlign="left"
            backgroundColor="transparent"
            borderWidth={0}
            color="$text"
            accessibilityLabel={`Enter amount of ${symbol}`}
            accessibilityHint={`Current balance is ${formatNumber(parseFloat(maxAmount))} ${symbol}`}
          />

          <XStack space="$2">
            <Button
              size="$3"
              theme="gray"
              onPress={handleMaxPress}
              disabled={disabled}
              accessibilityLabel="Use maximum amount"
              accessibilityHint={`Set amount to maximum balance of ${formatNumber(parseFloat(maxAmount))} ${symbol}`}
            >
              MAX
            </Button>

            <Button
              size="$4"
              theme="active"
              onPress={onSelectToken}
              disabled={!onSelectToken}
              icon={<Ionicons name="chevron-down" size={16} />}
              accessibilityLabel="Select token"
              accessibilityHint="Open token selection modal"
            >
              {symbol}
            </Button>
          </XStack>
        </XStack>

        {parseFloat(value) > parseFloat(maxAmount) && (
          <Text fontSize="$3" color="$error">
            Insufficient balance
          </Text>
        )}
      </YStack>
    </Card>
  )
}
