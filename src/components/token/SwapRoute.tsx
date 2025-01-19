import React from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

interface Token {
  symbol: string
  address: string
}

interface SwapRouteProps {
  route: string[]
  fromToken: Token
  toToken: Token
}

export const SwapRoute: React.FC<SwapRouteProps> = ({
  route,
  fromToken,
  toToken,
}) => {
  const getTokenSymbol = (address: string) => {
    if (address === fromToken.address) return fromToken.symbol
    if (address === toToken.address) return toToken.symbol
    return 'TOKEN'
  }

  return (
    <YStack space="$2">
      <Text fontSize="$3" color="$textMuted">
        Route
      </Text>
      <XStack
        space="$2"
        alignItems="center"
        flexWrap="wrap"
        accessibilityLabel={`Swap route from ${fromToken.symbol} to ${toToken.symbol}`}
      >
        {route.map((address, index) => (
          <React.Fragment key={address}>
            {index > 0 && (
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.textMuted}
              />
            )}
            <Text
              color="$text"
              backgroundColor="$backgroundHover"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
            >
              {getTokenSymbol(address)}
            </Text>
          </React.Fragment>
        ))}
      </XStack>
    </YStack>
  )
}
