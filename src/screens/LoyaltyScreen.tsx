import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { useQuery } from '@tanstack/react-query'
import { loyaltyService } from '@/services/loyalty/LoyaltyService'
import { walletService, useWalletStore } from '@/services/wallet/WalletService'
import { Button } from '@/components/ui/Button'
import { colors, spacing, typography } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { formatDistanceToNow } from 'date-fns'

type Props = NativeStackScreenProps<RootStackParamList, 'Loyalty'>

export const LoyaltyScreen: React.FC<Props> = ({ navigation }) => {
  const address = useWalletStore((state) => state.address)

  const { data: points } = useQuery({
    queryKey: ['loyalty', 'points', address],
    queryFn: () => loyaltyService.getUserPoints(address!),
    enabled: !!address,
  })

  const { data: currentTier } = useQuery({
    queryKey: ['loyalty', 'tier', address],
    queryFn: () => loyaltyService.getUserTier(address!),
    enabled: !!address,
  })

  const { data: activities } = useQuery({
    queryKey: ['loyalty', 'activities', address],
    queryFn: () => loyaltyService.getUserActivities(address!),
    enabled: !!address,
  })

  const { data: tiers } = useQuery({
    queryKey: ['loyalty', 'tiers'],
    queryFn: () => loyaltyService.getLoyaltyTiers(),
  })

  const handleViewNFT = async () => {
    const nft = await loyaltyService.getUserTierNFT(address!)
    if (nft) {
      navigation.navigate('NFTDetails', { nft })
    }
  }

  const renderTierCard = (tier: any, isCurrentTier: boolean) => (
    <Pressable
      key={tier.id}
      style={[styles.tierCard, isCurrentTier && styles.currentTierCard]}
      onPress={() => {
        AccessibilityInfo.announceForAccessibility(
          `${tier.name} tier. Required points: ${tier.requiredPoints}. Benefits: ${tier.benefits.join(
            ', '
          )}`
        )
      }}
      accessible={true}
      accessibilityLabel={`${tier.name} tier`}
      accessibilityHint="Double tap to hear tier details"
    >
      <LinearGradient
        colors={
          isCurrentTier
            ? [colors.primary, colors.primaryDark]
            : [colors.surface, colors.surfaceDark]
        }
        style={styles.tierGradient}
      >
        <View style={styles.tierHeader}>
          <Text
            style={[
              styles.tierName,
              isCurrentTier && styles.currentTierText,
            ]}
          >
            {tier.name}
          </Text>
          {isCurrentTier && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.white}
            />
          )}
        </View>

        <Text
          style={[
            styles.pointsRequired,
            isCurrentTier && styles.currentTierText,
          ]}
        >
          {tier.requiredPoints.toLocaleString()} points
        </Text>

        <View style={styles.benefitsList}>
          {tier.benefits.map((benefit: string, index: number) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons
                name="checkmark"
                size={16}
                color={isCurrentTier ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.benefitText,
                  isCurrentTier && styles.currentTierText,
                ]}
              >
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        {isCurrentTier && (
          <Button
            title="View NFT"
            onPress={handleViewNFT}
            variant="secondary"
            style={styles.viewNFTButton}
            accessibilityLabel="View NFT button"
            accessibilityHint="Double tap to view your tier NFT"
          />
        )}
      </LinearGradient>
    </Pressable>
  )

  const renderActivity = (activity: any) => (
    <View
      key={activity.transactionHash}
      style={styles.activityItem}
      accessible={true}
      accessibilityLabel={`${activity.type} activity`}
    >
      <View style={styles.activityIcon}>
        <Ionicons
          name={
            activity.type === 'BOOKING'
              ? 'airplane'
              : activity.type === 'REVIEW'
              ? 'star'
              : activity.type === 'REFERRAL'
              ? 'people'
              : 'checkmark-circle'
          }
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityType}>
          {activity.type.charAt(0) + activity.type.slice(1).toLowerCase()}
        </Text>
        <Text style={styles.activityPoints}>
          +{activity.points} points
        </Text>
        <Text style={styles.activityTime}>
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </Text>
      </View>
    </View>
  )

  if (!address) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Connect Wallet</Text>
        <Text style={styles.subtitle}>
          Please connect your wallet to view your loyalty program details
        </Text>
        <Button
          title="Connect Wallet"
          onPress={() => navigation.navigate('WalletSetup')}
          style={styles.connectButton}
          accessibilityLabel="Connect wallet button"
          accessibilityHint="Double tap to connect your wallet"
        />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Loyalty Program</Text>
        <Text style={styles.points}>
          {points?.toLocaleString()} points
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Your Current Tier</Text>
      {currentTier && renderTierCard(currentTier, true)}

      <Text style={styles.sectionTitle}>Available Tiers</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiersScroll}
      >
        {tiers?.map((tier) =>
          renderTierCard(tier, tier.id === currentTier?.id)
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activitiesList}>
        {activities?.map(renderActivity)}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  points: {
    ...typography.h2,
    color: colors.primary,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  tiersScroll: {
    paddingBottom: spacing.md,
  },
  tierCard: {
    width: 300,
    marginRight: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentTierCard: {
    transform: [{ scale: 1.05 }],
  },
  tierGradient: {
    padding: spacing.lg,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierName: {
    ...typography.h3,
    color: colors.text,
  },
  currentTierText: {
    color: colors.white,
  },
  pointsRequired: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  benefitsList: {
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  benefitText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  viewNFTButton: {
    marginTop: spacing.md,
  },
  activitiesList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    ...typography.bodyBold,
    color: colors.text,
  },
  activityPoints: {
    ...typography.body,
    color: colors.primary,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  connectButton: {
    marginTop: spacing.xl,
  },
})
