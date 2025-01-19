import React from 'react'
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
  Progress,
  Sheet,
} from 'tamagui'
import { RewardCard } from '@/components/token/RewardCard'
import { formatCurrency, formatNumber } from '@/utils/format'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'TokenRewards'>

export const TokenRewardsScreen: React.FC<Props> = () => {
  const address = useWalletStore((state) => state.address)
  const {
    data: rewards,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['token', 'rewards', address],
    queryFn: async () => {
      if (!address) return null
      const [staking, booking, referral] = await Promise.all([
        travlTokenService.getPendingRewards(address),
        travlTokenService.getBookingRewards(address),
        travlTokenService.getReferralCount(address),
      ])
      return {
        staking,
        booking,
        referralCount: referral,
        referralRewards: referral * 1000, // 1000 TRAVL per referral
      }
    },
    enabled: !!address,
  })

  const claimMutation = useMutation({
    mutationFn: () => travlTokenService.claimRewards(),
    onSuccess: () => {
      Alert.alert('Success', 'Successfully claimed rewards')
      refetch()
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to claim rewards: ' + error.message)
    },
  })

  const getTotalRewards = () => {
    if (!rewards) return 0
    return (
      parseFloat(rewards.staking) +
      parseFloat(rewards.booking) +
      rewards.referralRewards
    )
  }

  if (!address) {
    return (
      <YStack flex={1} padding="$4" space="$4" backgroundColor="$background">
        <Card bordered padded>
          <YStack space="$4" alignItems="center">
            <Ionicons
              name="wallet-outline"
              size={48}
              color={theme.colors.primary}
            />
            <Text
              textAlign="center"
              color="$text"
              fontSize="$6"
              fontWeight="bold"
            >
              Connect Wallet
            </Text>
            <Text textAlign="center" color="$textMuted" fontSize="$4">
              Please connect your wallet to view and claim your rewards
            </Text>
            <Button
              size="$5"
              theme="active"
              onPress={() => navigation.navigate('WalletSetup')}
            >
              Connect Wallet
            </Button>
          </YStack>
        </Card>
      </YStack>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <YStack padding="$4" space="$4">
        <Card bordered padded>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={[0, 0]}
            end={[1, 1]}
            style={{ borderRadius: 12, padding: 20 }}
          >
            <YStack space="$2">
              <Text color="white" fontSize="$3" opacity={0.8}>
                Total Rewards
              </Text>
              <Text color="white" fontSize="$8" fontWeight="bold">
                {formatNumber(getTotalRewards())} TRAVL
              </Text>
              <Text color="white" fontSize="$4">
                ≈ ${formatCurrency(getTotalRewards() * 0.2)}
              </Text>

              <Button
                marginTop="$4"
                size="$5"
                backgroundColor="white"
                color={theme.colors.primary}
                onPress={() => claimMutation.mutate()}
                disabled={getTotalRewards() <= 0 || claimMutation.isLoading}
                loading={claimMutation.isLoading}
              >
                Claim All Rewards
              </Button>
            </YStack>
          </LinearGradient>
        </Card>

        <YStack space="$4">
          <RewardCard
            title="Staking Rewards"
            icon="lock-closed"
            amount={rewards?.staking || '0'}
            description="Rewards earned from staking TRAVL tokens"
            color={theme.colors.success}
          />

          <RewardCard
            title="Booking Rewards"
            icon="airplane"
            amount={rewards?.booking || '0'}
            description="Rewards earned from travel bookings"
            color={theme.colors.primary}
          />

          <RewardCard
            title="Referral Rewards"
            icon="people"
            amount={rewards?.referralRewards.toString() || '0'}
            description={`${rewards?.referralCount || 0} successful referrals`}
            color={theme.colors.secondary}
          />
        </YStack>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Rewards History
            </Text>

            <YStack space="$3">
              <XStack
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                space="$3"
                alignItems="center"
              >
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.success}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="lock-closed"
                    size={24}
                    color={theme.colors.success}
                  />
                </Card>

                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Staking Reward
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    2 hours ago
                  </Text>
                </YStack>

                <Text fontSize="$4" color="$success">
                  +100 TRAVL
                </Text>
              </XStack>

              <XStack
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                space="$3"
                alignItems="center"
              >
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.primary}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="airplane"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Card>

                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Booking Reward
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    1 day ago
                  </Text>
                </YStack>

                <Text fontSize="$4" color="$primary">
                  +50 TRAVL
                </Text>
              </XStack>

              <XStack
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                space="$3"
                alignItems="center"
              >
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.secondary}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={theme.colors.secondary}
                  />
                </Card>

                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Referral Reward
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    3 days ago
                  </Text>
                </YStack>

                <Text fontSize="$4" color="$secondary">
                  +1,000 TRAVL
                </Text>
              </XStack>
            </YStack>

            <Button
              size="$4"
              variant="outlined"
              onPress={() => navigation.navigate('TokenActivity')}
            >
              View All History
            </Button>
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Rewards Program
            </Text>

            <YStack space="$3">
              <XStack space="$3" alignItems="center">
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.success}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="lock-closed"
                    size={24}
                    color={theme.colors.success}
                  />
                </Card>
                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Staking APR
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    Earn up to 5% APR by staking your TRAVL tokens
                  </Text>
                </YStack>
              </XStack>

              <XStack space="$3" alignItems="center">
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.primary}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="airplane"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Card>
                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Booking Rewards
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    Get 1% back in TRAVL tokens on all travel bookings
                  </Text>
                </YStack>
              </XStack>

              <XStack space="$3" alignItems="center">
                <Card
                  circular
                  size="$4"
                  backgroundColor={`${theme.colors.secondary}20`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={theme.colors.secondary}
                  />
                </Card>
                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Referral Program
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    Earn 1,000 TRAVL tokens for each successful referral
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
