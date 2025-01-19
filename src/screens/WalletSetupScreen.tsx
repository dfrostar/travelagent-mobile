import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  AccessibilityInfo,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/AppNavigator'
import { Button } from '@/components/ui/Button'
import { colors, spacing, typography } from '@/theme'
import { walletService, useWalletStore } from '@/services/wallet/WalletService'
import * as Clipboard from 'expo-clipboard'

type Props = NativeStackScreenProps<RootStackParamList, 'WalletSetup'>

export const WalletSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [mnemonic, setMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreateWallet = async () => {
    try {
      setLoading(true)
      const { address, mnemonic: newMnemonic } = await walletService.createWallet()
      setMnemonic(newMnemonic)
      setShowMnemonic(true)
      AccessibilityInfo.announceForAccessibility(
        'Wallet created successfully. Please save your recovery phrase.'
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleImportWallet = async () => {
    if (!mnemonic) {
      Alert.alert('Error', 'Please enter your recovery phrase')
      return
    }

    try {
      setLoading(true)
      await walletService.importWallet(mnemonic)
      navigation.replace('MainTabs')
      AccessibilityInfo.announceForAccessibility('Wallet imported successfully')
    } catch (error) {
      Alert.alert('Error', 'Invalid recovery phrase')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMnemonic = async () => {
    await Clipboard.setStringAsync(mnemonic)
    AccessibilityInfo.announceForAccessibility('Recovery phrase copied to clipboard')
    Alert.alert('Copied', 'Recovery phrase copied to clipboard')
  }

  const handleConfirmMnemonic = () => {
    Alert.alert(
      'Important',
      'Have you saved your recovery phrase? You will not be able to recover your wallet without it.',
      [
        {
          text: 'No, go back',
          style: 'cancel',
        },
        {
          text: 'Yes, continue',
          onPress: () => navigation.replace('MainTabs'),
        },
      ]
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Wallet Setup</Text>
        <Text style={styles.subtitle}>
          Create or import a wallet to start using cryptocurrency
        </Text>
      </View>

      {!showMnemonic ? (
        <View style={styles.buttonContainer}>
          <Button
            title="Create New Wallet"
            onPress={handleCreateWallet}
            loading={loading}
            style={styles.button}
            accessibilityLabel="Create new wallet button"
            accessibilityHint="Creates a new cryptocurrency wallet"
          />

          <Text style={styles.orText}>or</Text>

          <Text style={styles.importTitle}>Import Existing Wallet</Text>
          <TextInput
            style={styles.input}
            value={mnemonic}
            onChangeText={setMnemonic}
            placeholder="Enter recovery phrase"
            multiline
            numberOfLines={3}
            accessibilityLabel="Recovery phrase input"
            accessibilityHint="Enter your 12 or 24 word recovery phrase"
          />

          <Button
            title="Import Wallet"
            onPress={handleImportWallet}
            loading={loading}
            disabled={!mnemonic}
            variant="secondary"
            style={styles.button}
            accessibilityLabel="Import wallet button"
            accessibilityHint="Imports an existing wallet using the recovery phrase"
          />
        </View>
      ) : (
        <View style={styles.mnemonicContainer}>
          <Text style={styles.warningText}>
            WARNING: Never share your recovery phrase with anyone. Store it in a
            safe place.
          </Text>

          <View style={styles.mnemonicBox}>
            <Text style={styles.mnemonicText}>{mnemonic}</Text>
          </View>

          <Button
            title="Copy Recovery Phrase"
            onPress={handleCopyMnemonic}
            variant="secondary"
            style={styles.button}
            accessibilityLabel="Copy recovery phrase button"
            accessibilityHint="Copies the recovery phrase to clipboard"
          />

          <Button
            title="I've Saved My Recovery Phrase"
            onPress={handleConfirmMnemonic}
            style={[styles.button, styles.confirmButton]}
            accessibilityLabel="Confirm recovery phrase saved button"
            accessibilityHint="Confirms that you have saved your recovery phrase"
          />
        </View>
      )}
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
  },
  buttonContainer: {
    gap: spacing.lg,
  },
  button: {
    width: '100%',
  },
  orText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  importTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  mnemonicContainer: {
    gap: spacing.lg,
  },
  warningText: {
    ...typography.bodyBold,
    color: colors.error,
    textAlign: 'center',
  },
  mnemonicBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mnemonicText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: spacing.md,
  },
})
