import React, { useState, useEffect } from 'react'
import { ScrollView, Alert } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useQuery, useMutation } from '@tanstack/react-query'
import { travlTokenService } from '@/services/token/TravelTokenService'
import { useWalletStore } from '@/services/wallet/WalletService'
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Sheet,
  Spinner,
  Select,
} from 'tamagui'
import { TokenInput } from '@/components/token/TokenInput'
import { SwapRoute } from '@/components/token/SwapRoute'
import { PriceImpact } from '@/components/token/PriceImpact'
import { formatCurrency, formatNumber } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'
import { ethers } from 'ethers'

type Token = {
  symbol: string
  address: string
  decimals: number
  balance: string
}

type Props = NativeStackScreenProps<RootStackParamList, 'TokenSwap'>

export const TokenSwapScreen: React.FC<Props> = ({ navigation }) => {
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'ETH',
    address: travlTokenService.TOKEN_PAIRS.ETH,
    decimals: 18,
    balance: '0',
  })
  const [toToken, setToToken] = useState<Token>({
    symbol: 'TRAVL',
    address: travlTokenService.TOKEN_ADDRESS,
    decimals: 18,
    balance: '0',
  })
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5) // 0.5%
  const [showSettings, setShowSettings] = useState(false)
  const [priceImpact, setPriceImpact] = useState(0)
  const [route, setRoute] = useState<string[]>([])

  const address = useWalletStore((state) => state.address)

  const { isLoading: isLoadingPrices, data: prices } = useQuery({
    queryKey: ['token', 'prices', fromToken.address, toToken.address, fromAmount],
    queryFn: async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) return null
      const amounts = await travlTokenService.getAmountsOut(
        fromAmount,
        [fromToken.address, toToken.address]
      )
      return amounts
    },
    enabled: !!fromAmount && parseFloat(fromAmount) > 0,
  })

  useEffect(() => {
    if (prices?.amountOut) {
      setToAmount(prices.amountOut)
      setPriceImpact(prices.priceImpact)
      setRoute(prices.route)
    } else {
      setToAmount('')
      setPriceImpact(0)
      setRoute([])
    }
  }, [prices])

  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!fromAmount || !toAmount) throw new Error('Invalid amounts')
      return travlTokenService.swap(
        fromToken.address,
        toToken.address,
        fromAmount,
        toAmount,
        slippage
      )
    },
    onSuccess: () => {
      Alert.alert('Success', 'Swap completed successfully')
      setFromAmount('')
      setToAmount('')
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to complete swap: ' + error.message)
    },
  })

  const handleSwap = async () => {
    if (!address) {
      Alert.alert('Error', 'Please connect your wallet')
      return
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    if (parseFloat(fromAmount) > parseFloat(fromToken.balance)) {
      Alert.alert('Error', 'Insufficient balance')
      return
    }

    if (priceImpact > 5) {
      Alert.alert(
        'Warning',
        'Price impact is high. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => swapMutation.mutate() },
        ]
      )
    } else {
      swapMutation.mutate()
    }
  }

  const switchTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount('')
    setToAmount('')
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack padding="$4" space="$4">
          <Card bordered padded>
            <YStack space="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold" color="$text">
                  Swap Tokens
                </Text>
                <Button
                  size="$3"
                  circular
                  icon={<Ionicons name="settings-outline" size={20} />}
                  onPress={() => setShowSettings(true)}
                />
              </XStack>

              <YStack space="$2">
                <Text fontSize="$4" color="$text">
                  From
                </Text>
                <TokenInput
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  maxAmount={fromToken.balance}
                  symbol={fromToken.symbol}
                  onSelectToken={() => navigation.navigate('TokenSelect', {
                    onSelect: setFromToken,
                    exclude: [toToken.address],
                  })}
                />
              </YStack>

              <XStack justifyContent="center">
                <Button
                  size="$4"
                  circular
                  icon={<Ionicons name="swap-vertical" size={24} />}
                  onPress={switchTokens}
                />
              </XStack>

              <YStack space="$2">
                <Text fontSize="$4" color="$text">
                  To
                </Text>
                <TokenInput
                  value={toAmount}
                  onChangeText={setToAmount}
                  maxAmount={toToken.balance}
                  symbol={toToken.symbol}
                  disabled
                  onSelectToken={() => navigation.navigate('TokenSelect', {
                    onSelect: setToToken,
                    exclude: [fromToken.address],
                  })}
                />
              </YStack>

              {isLoadingPrices && (
                <XStack justifyContent="center" padding="$4">
                  <Spinner size="large" color="$primary" />
                </XStack>
              )}

              {route.length > 0 && (
                <Card backgroundColor="$backgroundHover" padded>
                  <YStack space="$3">
                    <XStack justifyContent="space-between">
                      <Text color="$textMuted">Rate</Text>
                      <Text color="$text">
                        1 {fromToken.symbol} ≈{' '}
                        {formatNumber(parseFloat(prices?.rate || '0'))} {toToken.symbol}
                      </Text>
                    </XStack>

                    <SwapRoute
                      route={route}
                      fromToken={fromToken}
                      toToken={toToken}
                    />

                    <PriceImpact value={priceImpact} />

                    <XStack justifyContent="space-between">
                      <Text color="$textMuted">Minimum received</Text>
                      <Text color="$text">
                        {formatNumber(
                          parseFloat(toAmount) * (1 - slippage / 100)
                        )}{' '}
                        {toToken.symbol}
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              )}

              <Button
                size="$5"
                theme="active"
                onPress={handleSwap}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0 || swapMutation.isLoading}
                loading={swapMutation.isLoading}
              >
                {!address
                  ? 'Connect Wallet'
                  : !fromAmount
                  ? 'Enter Amount'
                  : 'Swap Tokens'}
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      <Sheet
        modal
        open={showSettings}
        onOpenChange={setShowSettings}
        snapPoints={[40]}
        dismissOnSnapToBottom
      >
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack space="$4">
            <Text fontSize="$6" fontWeight="bold" color="$text">
              Swap Settings
            </Text>

            <YStack space="$2">
              <Text fontSize="$4" color="$text">
                Slippage Tolerance
              </Text>
              <XStack space="$2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <Button
                    key={value}
                    flex={1}
                    size="$4"
                    theme={slippage === value ? 'active' : 'gray'}
                    onPress={() => setSlippage(value)}
                  >
                    {value}%
                  </Button>
                ))}
              </XStack>
            </YStack>

            <Text fontSize="$3" color="$textMuted">
              Your transaction will revert if the price changes unfavorably by more
              than this percentage.
            </Text>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
