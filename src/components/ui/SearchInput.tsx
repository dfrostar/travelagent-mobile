import React, { useRef } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  AccessibilityProps,
  Keyboard,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography, shadows } from '@/theme'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onVoicePress: () => void
  placeholder?: string
  voiceEnabled?: boolean
  isLoading?: boolean
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
  placeholder = 'Where would you like to go?',
  voiceEnabled = true,
  isLoading = false,
}) => {
  const inputRef = useRef<TextInput>(null)

  const handleVoicePress = () => {
    Keyboard.dismiss()
    onVoicePress()
  }

  const inputAccessibilityProps: AccessibilityProps = {
    accessible: true,
    accessibilityLabel: 'Search destination input',
    accessibilityHint: 'Enter your desired travel destination',
    accessibilityRole: 'search',
  }

  const voiceAccessibilityProps: AccessibilityProps = {
    accessible: true,
    accessibilityLabel: 'Voice search',
    accessibilityHint: 'Activate to search by voice',
    accessibilityRole: 'button',
  }

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={focusInput}
        activeOpacity={1}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          {...inputAccessibilityProps}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
            accessibilityHint="Clear the search input"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {voiceEnabled && (
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isLoading && styles.voiceButtonLoading,
          ]}
          onPress={handleVoicePress}
          disabled={isLoading}
          {...voiceAccessibilityProps}
        >
          <Ionicons
            name={isLoading ? 'mic-off' : 'mic'}
            size={24}
            color={colors.background}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        ...shadows,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.sm,
  },
  voiceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows,
      android: {
        elevation: 4,
      },
    }),
  },
  voiceButtonLoading: {
    backgroundColor: colors.textSecondary,
  },
})
