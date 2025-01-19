import React from 'react'
import { ScrollView, RefreshControl, AccessibilityInfo } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useQuery } from '@tanstack/react-query'
import { travlTokenService } from '@/services/token/TravelTokenService'
import { useWalletStore } from '@/services/wallet/WalletService'
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Progress,
  AnimatePresence,
} from 'tamagui'
import { TokenMetricsCard } from '@/components/token/TokenMetricsCard'
import { StakingCard } from '@/components/token/StakingCard'
import { RewardsCard } from '@/components/token/RewardsCard'
import { TokenChart } from '@/components/token/TokenChart'
import { useTokenStore } from '@/services/token/TravelTokenService'
import { formatCurrency, formatNumber } from '@/utils/format'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'
import Skia from '@shopify/react-native-skia'

type Props = NativeStackScreenProps<RootStackParamList, 'TokenDashboard'>

export const TokenDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const address = useWalletStore((state) => state.address)
  const {
    balance,
    stakedBalance,
    rewards,
    metrics,
  } = useTokenStore()

  const { isLoading, refetch } = useQuery({
    queryKey: ['token', 'dashboard', address],
    queryFn: async () => {
      if (!address) return null
      await Promise.all([
        travlTokenService.getBalance(address),
        travlTokenService.getStakedBalance(address),
        travlTokenService.getPendingRewards(address),
        travlTokenService.getTokenMetrics(),
      ])
      return true
    },
    enabled: !!address,
  })

  const handleStake = () => {
    navigation.navigate('TokenStaking')
  }

  const handleSwap = () => {
    navigation.navigate('TokenSwap')
  }

  const handleSend = () => {
    navigation.navigate('TokenSend')
  }

  const handleViewMetrics = () => {
    navigation.navigate('TokenMetrics')
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
              Please connect your wallet to view your TRAVL token dashboard
            </Text>
            <Button
              size="$5"
              theme="active"
              onPress={() => navigation.navigate('WalletSetup')}
              accessibilityLabel="Connect wallet button"
              accessibilityHint="Double tap to connect your wallet"
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
                Total Balance
              </Text>
              <Text color="white" fontSize="$8" fontWeight="bold">
                {formatNumber(parseFloat(balance))} TRAVL
              </Text>
              <Text color="white" fontSize="$4">
                ≈ ${formatCurrency(parseFloat(balance) * 0.2)}
              </Text>
            </YStack>
          </LinearGradient>

          <XStack marginTop="$4" space="$2">
            <Button
              flex={1}
              size="$4"
              theme="active"
              onPress={handleStake}
              icon={<Ionicons name="lock-closed" size={20} />}
              accessibilityLabel="Stake tokens button"
            >
              Stake
            </Button>
            <Button
              flex={1}
              size="$4"
              theme="active"
              onPress={handleSwap}
              icon={<Ionicons name="swap-horizontal" size={20} />}
              accessibilityLabel="Swap tokens button"
            >
              Swap
            </Button>
            <Button
              flex={1}
              size="$4"
              theme="active"
              onPress={handleSend}
              icon={<Ionicons name="send" size={20} />}
              accessibilityLabel="Send tokens button"
            >
              Send
            </Button>
          </XStack>
        </Card>

        <TokenMetricsCard
          metrics={metrics}
          onViewMore={handleViewMetrics}
        />

        <XStack space="$4">
          <StakingCard
            stakedBalance={stakedBalance}
            onStake={handleStake}
          />
          <RewardsCard
            rewards={rewards}
            onClaim={() => navigation.navigate('TokenRewards')}
          />
        </XStack>

        <Card bordered padded>
          <YStack space="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold" color="$text">
                Price History
              </Text>
              <Button
                size="$3"
                variant="outlined"
                onPress={() => navigation.navigate('TokenChart')}
              >
                View More
              </Button>
            </XStack>
            <TokenChart height={200} />
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Recent Activity
            </Text>
            <YStack space="$2">
              {/* Activity items */}
              <XStack
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                space="$3"
                alignItems="center"
              >
                <Ionicons
                  name="arrow-up"
                  size={24}
                  color={theme.colors.success}
                />
                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Staked TRAVL
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    2 hours ago
                  </Text>
                </YStack>
                <Text fontSize="$4" color="$success">
                  +1,000 TRAVL
                </Text>
              </XStack>

              <XStack
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                space="$3"
                alignItems="center"
              >
                <Ionicons
                  name="swap-horizontal"
                  size={24}
                  color={theme.colors.primary}
                />
                <YStack flex={1}>
                  <Text fontSize="$4" color="$text">
                    Swapped ETH → TRAVL
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    5 hours ago
                  </Text>
                </YStack>
                <Text fontSize="$4" color="$primary">
                  +500 TRAVL
                </Text>
              </XStack>
            </YStack>

            <Button
              size="$4"
              variant="outlined"
              onPress={() => navigation.navigate('TokenActivity')}
            >
              View All Activity
            </Button>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
