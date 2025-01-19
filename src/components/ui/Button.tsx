import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { colors, typography, borderRadius } from '@/theme'

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        Platform.select({
          ios: styles.iosButton,
          android: styles.androidButton,
        }),
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.background,
    ...typography.body,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
  },
  iosButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  androidButton: {
    elevation: 5,
  },
})
