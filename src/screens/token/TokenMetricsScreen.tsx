import React from 'react'
import { ScrollView, RefreshControl, Dimensions } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useQuery } from '@tanstack/react-query'
import { travlTokenService } from '@/services/token/TravelTokenService'
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Progress,
} from 'tamagui'
import { TokenMetricsCard } from '@/components/token/TokenMetricsCard'
import { TokenDistributionChart } from '@/components/token/TokenDistributionChart'
import { formatCurrency, formatNumber } from '@/utils/format'
import { LinearGradient } from '@tamagui/linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'
import {
  LineChart,
  PieChart,
} from 'react-native-chart-kit'

type Props = NativeStackScreenProps<RootStackParamList, 'TokenMetrics'>

const screenWidth = Dimensions.get('window').width

export const TokenMetricsScreen: React.FC<Props> = () => {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['token', 'metrics'],
    queryFn: () => travlTokenService.getTokenMetrics(),
  })

  const tokenomics = travlTokenService.getTokenomics()

  const priceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [0.1, 0.15, 0.12, 0.18, 0.16, 0.2],
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  }

  const distributionData = [
    {
      name: 'Community',
      percentage: 40,
      color: theme.colors.primary,
    },
    {
      name: 'Development',
      percentage: 20,
      color: theme.colors.secondary,
    },
    {
      name: 'Team',
      percentage: 15,
      color: theme.colors.success,
    },
    {
      name: 'Marketing',
      percentage: 10,
      color: theme.colors.warning,
    },
    {
      name: 'Treasury',
      percentage: 10,
      color: theme.colors.error,
    },
    {
      name: 'Advisors',
      percentage: 5,
      color: theme.colors.info,
    },
  ]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <YStack padding="$4" space="$4">
        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Token Metrics
            </Text>

            <YStack space="$3">
              <XStack justifyContent="space-between">
                <Text color="$textMuted">Market Cap</Text>
                <Text color="$text" fontWeight="bold">
                  ${formatCurrency(parseFloat(metrics?.marketCap || '0'))}
                </Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Circulating Supply</Text>
                <Text color="$text">
                  {formatNumber(parseFloat(metrics?.circulatingSupply || '0'))} TRAVL
                </Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Total Supply</Text>
                <Text color="$text">
                  {formatNumber(100000000)} TRAVL
                </Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Total Staked</Text>
                <Text color="$text">
                  {formatNumber(parseFloat(metrics?.totalStaked || '0'))} TRAVL
                </Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Staking APR</Text>
                <Text color="$success" fontWeight="bold">
                  {metrics?.stakingAPR || '5.00'}%
                </Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Total Holders</Text>
                <Text color="$text">
                  {formatNumber(metrics?.totalHolders || 0)}
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Price History
            </Text>

            <LineChart
              data={priceData}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.background,
                backgroundGradientFrom: theme.colors.background,
                backgroundGradientTo: theme.colors.background,
                decimalPlaces: 2,
                color: (opacity = 1) => theme.colors.primary,
                labelColor: (opacity = 1) => theme.colors.text,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: theme.colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Token Distribution
            </Text>

            <TokenDistributionChart data={distributionData} />

            <YStack space="$2">
              {distributionData.map((item) => (
                <XStack
                  key={item.name}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <XStack space="$2" alignItems="center">
                    <Card
                      size="$1"
                      backgroundColor={item.color}
                      borderRadius="$1"
                    />
                    <Text color="$textMuted">{item.name}</Text>
                  </XStack>
                  <Text color="$text">
                    {formatNumber(item.percentage)}%
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Vesting Schedule
            </Text>

            <YStack space="$3">
              {Object.entries(tokenomics.vestingSchedule).map(([role, schedule]) => (
                <YStack key={role} space="$2">
                  <Text fontSize="$4" color="$text" fontWeight="500">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                  <Text fontSize="$3" color="$textMuted">
                    {schedule}
                  </Text>
                  <Progress value={40} backgroundColor="$backgroundHover">
                    <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
                  </Progress>
                </YStack>
              ))}
            </YStack>
          </YStack>
        </Card>

        <Card bordered padded>
          <YStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$text">
              Token Details
            </Text>

            <YStack space="$3">
              <XStack justifyContent="space-between">
                <Text color="$textMuted">Name</Text>
                <Text color="$text">{tokenomics.name}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Symbol</Text>
                <Text color="$text">{tokenomics.symbol}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Decimals</Text>
                <Text color="$text">{tokenomics.decimals}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Staking Period</Text>
                <Text color="$text">{tokenomics.stakingPeriod}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Booking Reward Rate</Text>
                <Text color="$text">{tokenomics.bookingRewardRate}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Referral Reward</Text>
                <Text color="$text">{tokenomics.referralReward}</Text>
              </XStack>

              <XStack justifyContent="space-between">
                <Text color="$textMuted">Points to Token Rate</Text>
                <Text color="$text">{tokenomics.pointsToTokenRate}</Text>
              </XStack>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
