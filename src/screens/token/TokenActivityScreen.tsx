import React, { useState } from 'react'
import { FlatList, RefreshControl, Linking } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useInfiniteQuery } from '@tanstack/react-query'
import { travlTokenService } from '@/services/token/TravelTokenService'
import { useWalletStore } from '@/services/wallet/WalletService'
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Select,
  Sheet,
} from 'tamagui'
import { formatDistance } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '@/theme'
import { formatNumber } from '@/utils/format'

type ActivityType = 'all' | 'swap' | 'stake' | 'transfer' | 'reward'

interface Activity {
  id: string
  type: ActivityType
  amount: string
  timestamp: number
  hash: string
  status: 'pending' | 'completed' | 'failed'
  details: {
    fromToken?: string
    toToken?: string
    fromAmount?: string
    toAmount?: string
    recipient?: string
    sender?: string
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'TokenActivity'>

export const TokenActivityScreen: React.FC<Props> = () => {
  const [selectedType, setSelectedType] = useState<ActivityType>('all')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const address = useWalletStore((state) => state.address)

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['token', 'activity', address, selectedType],
    queryFn: async ({ pageParam = 0 }) => {
      const activities = await travlTokenService.getActivities(
        address!,
        selectedType,
        pageParam,
        20
      )
      return activities
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!address,
  })

  const activities = data?.pages.flatMap((page) => page.activities) || []

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'swap':
        return 'swap-horizontal'
      case 'stake':
        return 'lock-closed'
      case 'transfer':
        return 'arrow-forward'
      case 'reward':
        return 'gift'
      default:
        return 'cube'
    }
  }

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'swap':
        return theme.colors.primary
      case 'stake':
        return theme.colors.success
      case 'transfer':
        return theme.colors.warning
      case 'reward':
        return theme.colors.secondary
      default:
        return theme.colors.text
    }
  }

  const getActivityTitle = (activity: Activity) => {
    switch (activity.type) {
      case 'swap':
        return `Swapped ${activity.details.fromToken} → ${activity.details.toToken}`
      case 'stake':
        return 'Staked TRAVL'
      case 'transfer':
        return activity.details.recipient === address
          ? 'Received TRAVL'
          : 'Sent TRAVL'
      case 'reward':
        return 'Claimed Rewards'
      default:
        return 'Token Activity'
    }
  }

  const getActivityAmount = (activity: Activity) => {
    switch (activity.type) {
      case 'swap':
        return `${formatNumber(parseFloat(activity.details.fromAmount!))} ${
          activity.details.fromToken
        } → ${formatNumber(parseFloat(activity.details.toAmount!))} ${
          activity.details.toToken
        }`
      case 'transfer':
        return `${formatNumber(parseFloat(activity.amount))} TRAVL`
      default:
        return `${formatNumber(parseFloat(activity.amount))} TRAVL`
    }
  }

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <Card
      bordered
      padded
      marginBottom="$2"
      pressStyle={{ opacity: 0.7 }}
      onPress={() => setSelectedActivity(item)}
    >
      <XStack space="$3" alignItems="center">
        <Card
          circular
          size="$4"
          backgroundColor={`${getActivityColor(item.type)}20`}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons
            name={getActivityIcon(item.type)}
            size={24}
            color={getActivityColor(item.type)}
          />
        </Card>

        <YStack flex={1} space="$1">
          <Text fontSize="$4" color="$text" fontWeight="500">
            {getActivityTitle(item)}
          </Text>
          <Text fontSize="$3" color="$textMuted">
            {formatDistance(item.timestamp * 1000, new Date(), {
              addSuffix: true,
            })}
          </Text>
        </YStack>

        <YStack alignItems="flex-end" space="$1">
          <Text
            fontSize="$4"
            color={item.status === 'failed' ? '$error' : '$text'}
            fontWeight="500"
          >
            {getActivityAmount(item)}
          </Text>
          <Text
            fontSize="$3"
            color={
              item.status === 'pending'
                ? '$warning'
                : item.status === 'failed'
                ? '$error'
                : '$success'
            }
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </YStack>
      </XStack>
    </Card>
  )

  return (
    <>
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingHorizontal="$4"
        space="$4"
      >
        <XStack paddingVertical="$4" space="$2">
          {(['all', 'swap', 'stake', 'transfer', 'reward'] as ActivityType[]).map(
            (type) => (
              <Button
                key={type}
                size="$3"
                theme={selectedType === type ? 'active' : 'gray'}
                onPress={() => setSelectedType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            )
          )}
        </XStack>

        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <YStack padding="$4" alignItems="center" space="$2">
              <Ionicons
                name="document-text-outline"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text fontSize="$5" color="$textMuted" textAlign="center">
                No activities found
              </Text>
              <Text fontSize="$3" color="$textMuted" textAlign="center">
                Your token activities will appear here
              </Text>
            </YStack>
          }
        />
      </YStack>

      <Sheet
        modal
        open={!!selectedActivity}
        onOpenChange={() => setSelectedActivity(null)}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          {selectedActivity && (
            <YStack space="$4">
              <Text fontSize="$6" fontWeight="bold" color="$text">
                Activity Details
              </Text>

              <Card backgroundColor="$backgroundHover" padded>
                <YStack space="$3">
                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Type</Text>
                    <Text color="$text" fontWeight="500">
                      {selectedActivity.type.charAt(0).toUpperCase() +
                        selectedActivity.type.slice(1)}
                    </Text>
                  </XStack>

                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Amount</Text>
                    <Text color="$text" fontWeight="500">
                      {getActivityAmount(selectedActivity)}
                    </Text>
                  </XStack>

                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Status</Text>
                    <Text
                      color={
                        selectedActivity.status === 'pending'
                          ? '$warning'
                          : selectedActivity.status === 'failed'
                          ? '$error'
                          : '$success'
                      }
                      fontWeight="500"
                    >
                      {selectedActivity.status.charAt(0).toUpperCase() +
                        selectedActivity.status.slice(1)}
                    </Text>
                  </XStack>

                  <XStack justifyContent="space-between">
                    <Text color="$textMuted">Time</Text>
                    <Text color="$text">
                      {new Date(
                        selectedActivity.timestamp * 1000
                      ).toLocaleString()}
                    </Text>
                  </XStack>

                  {selectedActivity.type === 'transfer' && (
                    <>
                      <XStack justifyContent="space-between">
                        <Text color="$textMuted">From</Text>
                        <Text color="$text" numberOfLines={1}>
                          {selectedActivity.details.sender}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <Text color="$textMuted">To</Text>
                        <Text color="$text" numberOfLines={1}>
                          {selectedActivity.details.recipient}
                        </Text>
                      </XStack>
                    </>
                  )}

                  <Button
                    size="$4"
                    theme="gray"
                    onPress={() =>
                      Linking.openURL(
                        `https://etherscan.io/tx/${selectedActivity.hash}`
                      )
                    }
                    icon={<Ionicons name="open-outline" size={20} />}
                  >
                    View on Explorer
                  </Button>
                </YStack>
              </Card>
            </YStack>
          )}
        </Sheet.Frame>
      </Sheet>
    </>
  )
}
