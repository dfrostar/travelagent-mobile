import React from 'react'
import { YStack, XStack, Text, Card, Button } from 'tamagui'
import { formatCurrency, formatNumber } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'

interface TokenMetricsCardProps {
  metrics: {
    marketCap: string
    circulatingSupply: string
    totalStaked: string
    stakingAPR: string
    totalHolders: number
  } | null
  onViewMore: () => void
}

export const TokenMetricsCard: React.FC<TokenMetricsCardProps> = ({
  metrics,
  onViewMore,
}) => {
  return (
    <Card bordered padded>
      <YStack space="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold" color="$text">
            Token Metrics
          </Text>
          <Button
            size="$3"
            variant="outlined"
            onPress={onViewMore}
            icon={<Ionicons name="stats-chart" size={18} />}
          >
            View More
          </Button>
        </XStack>

        <XStack flexWrap="wrap" margin="$-2">
          <YStack padding="$2" width="50%">
            <Card
              backgroundColor="$backgroundHover"
              padded
              elevate
              bordered
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <YStack space="$1">
                <Text fontSize="$3" color="$textMuted">
                  Market Cap
                </Text>
                <Text fontSize="$5" color="$text" fontWeight="bold">
                  ${formatCurrency(parseFloat(metrics?.marketCap || '0'))}
                </Text>
              </YStack>
            </Card>
          </YStack>

          <YStack padding="$2" width="50%">
            <Card
              backgroundColor="$backgroundHover"
              padded
              elevate
              bordered
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <YStack space="$1">
                <Text fontSize="$3" color="$textMuted">
                  Total Staked
                </Text>
                <Text fontSize="$5" color="$text" fontWeight="bold">
                  {formatNumber(parseFloat(metrics?.totalStaked || '0'))}
                </Text>
              </YStack>
            </Card>
          </YStack>

          <YStack padding="$2" width="50%">
            <Card
              backgroundColor="$backgroundHover"
              padded
              elevate
              bordered
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <YStack space="$1">
                <Text fontSize="$3" color="$textMuted">
                  Staking APR
                </Text>
                <Text fontSize="$5" color="$success" fontWeight="bold">
                  {metrics?.stakingAPR || '5.00'}%
                </Text>
              </YStack>
            </Card>
          </YStack>

          <YStack padding="$2" width="50%">
            <Card
              backgroundColor="$backgroundHover"
              padded
              elevate
              bordered
              animation="bouncy"
              pressStyle={{ scale: 0.97 }}
            >
              <YStack space="$1">
                <Text fontSize="$3" color="$textMuted">
                  Total Holders
                </Text>
                <Text fontSize="$5" color="$text" fontWeight="bold">
                  {formatNumber(metrics?.totalHolders || 0)}
                </Text>
              </YStack>
            </Card>
          </YStack>
        </XStack>
      </YStack>
    </Card>
  )
}
