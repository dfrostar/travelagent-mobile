import React, { useState } from 'react'
import { ScrollView, RefreshControl, Alert } from 'react-native'
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
  Input,
  Separator,
  Progress,
  Sheet,
  Label,
  Switch,
} from 'tamagui'
import { TokenInput } from '@/components/token/TokenInput'
import { StakingInfoCard } from '@/components/token/StakingInfoCard'
import { useTokenStore } from '@/services/token/TravelTokenService'
import { formatCurrency, formatNumber } from '@/utils/format'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'
import { ethers } from 'ethers'

type Props = NativeStackScreenProps<RootStackParamList, 'TokenStaking'>

export const TokenStakingScreen: React.FC<Props> = ({ navigation }) => {
  const [amount, setAmount] = useState('')
  const [isCompounding, setIsCompounding] = useState(true)
  const [stakingPeriod, setStakingPeriod] = useState(30) // days
  const [showConfirm, setShowConfirm] = useState(false)

  const address = useWalletStore((state) => state.address)
  const { balance, stakedBalance } = useTokenStore()

  const { isLoading: isLoadingData, refetch } = useQuery({
    queryKey: ['token', 'staking', address],
    queryFn: async () => {
      if (!address) return null
      await Promise.all([
        travlTokenService.getBalance(address),
        travlTokenService.getStakedBalance(address),
      ])
      return true
    },
    enabled: !!address,
  })

  const stakeMutation = useMutation({
    mutationFn: (stakeAmount: string) => travlTokenService.stake(stakeAmount),
    onSuccess: () => {
      Alert.alert('Success', 'Successfully staked TRAVL tokens')
      setAmount('')
      refetch()
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to stake tokens: ' + error.message)
    },
  })

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      Alert.alert('Error', 'Insufficient balance')
      return
    }

    try {
      await stakeMutation.mutateAsync(amount)
    } catch (error) {
      console.error('Stake error:', error)
    }
  }

  const getEstimatedRewards = () => {
    const amountNum = parseFloat(amount || '0')
    const apr = 0.05 // 5% base APR
    const compoundingPeriods = isCompounding ? 12 : 1 // monthly compounding
    
    if (isCompounding) {
      // Compound interest formula: A = P(1 + r/n)^(nt)
      const r = apr
      const n = compoundingPeriods
      const t = stakingPeriod / 365
      return amountNum * Math.pow(1 + r/n, n*t) - amountNum
    } else {
      // Simple interest formula: A = P(1 + rt)
      return amountNum * apr * (stakingPeriod / 365)
    }
  }

  const estimatedRewards = getEstimatedRewards()

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        refreshControl={
          <RefreshControl refreshing={isLoadingData} onRefresh={refetch} />
        }
      >
        <YStack padding="$4" space="$4">
          <Card bordered padded>
            <YStack space="$4">
              <Text fontSize="$5" fontWeight="bold" color="$text">
                Stake TRAVL
              </Text>
              
              <TokenInput
                value={amount}
                onChangeText={setAmount}
                maxAmount={balance}
                symbol="TRAVL"
              />

              <Separator />
              
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Label htmlFor="compound" color="$text">
                    Auto-compound rewards
                  </Label>
                  <Switch
                    id="compound"
                    checked={isCompounding}
                    onCheckedChange={setIsCompounding}
                  />
                </XStack>

                <Text fontSize="$3" color="$textMuted">
                  {isCompounding
                    ? 'Rewards will be automatically restaked monthly'
                    : 'Rewards will be claimable manually'}
                </Text>
              </YStack>

              <YStack space="$2">
                <Text fontSize="$4" color="$text">
                  Staking Period
                </Text>
                <XStack space="$2">
                  {[30, 90, 180].map((days) => (
                    <Button
                      key={days}
                      flex={1}
                      size="$4"
                      theme={stakingPeriod === days ? 'active' : 'gray'}
                      onPress={() => setStakingPeriod(days)}
                    >
                      {days} Days
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <Card backgroundColor="$backgroundHover" padded>
                <YStack space="$2">
                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Estimated APR</Text>
                    <Text color="$success" fontWeight="bold">
                      5.00%
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Staking Amount</Text>
                    <Text color="$text">
                      {formatNumber(parseFloat(amount || '0'))} TRAVL
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Est. Rewards</Text>
                    <Text color="$success">
                      {formatNumber(estimatedRewards)} TRAVL
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Lock Period</Text>
                    <Text color="$text">{stakingPeriod} Days</Text>
                  </XStack>
                </YStack>
              </Card>

              <Button
                size="$5"
                theme="active"
                onPress={() => setShowConfirm(true)}
                disabled={!amount || parseFloat(amount) <= 0}
                loading={stakeMutation.isLoading}
              >
                Stake TRAVL
              </Button>
            </YStack>
          </Card>

          <StakingInfoCard
            stakedBalance={stakedBalance}
            stakingPeriod={stakingPeriod}
            isCompounding={isCompounding}
          />
        </YStack>
      </ScrollView>

      <Sheet
        modal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        snapPoints={[50]}
        dismissOnSnapToBottom
      >
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack space="$4">
            <Text fontSize="$6" fontWeight="bold" color="$text">
              Confirm Staking
            </Text>
            
            <Card backgroundColor="$backgroundHover" padded>
              <YStack space="$2">
                <XStack justifyContent="space-between">
                  <Text color="$textMuted">Amount to Stake</Text>
                  <Text color="$text" fontWeight="bold">
                    {formatNumber(parseFloat(amount))} TRAVL
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$textMuted">Lock Period</Text>
                  <Text color="$text">{stakingPeriod} Days</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$textMuted">Auto-compound</Text>
                  <Text color="$text">{isCompounding ? 'Yes' : 'No'}</Text>
                </XStack>
              </YStack>
            </Card>

            <Text fontSize="$3" color="$textMuted" textAlign="center">
              Please confirm that you want to stake your TRAVL tokens.
              This action cannot be undone until the lock period ends.
            </Text>

            <XStack space="$2">
              <Button
                flex={1}
                size="$5"
                theme="gray"
                onPress={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                size="$5"
                theme="active"
                onPress={() => {
                  setShowConfirm(false)
                  handleStake()
                }}
                loading={stakeMutation.isLoading}
              >
                Confirm Stake
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
