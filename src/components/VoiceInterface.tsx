import React, { useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { WhisperService } from '@/services/speech/WhisperService'
import { colors, spacing } from '@/theme'
import CONFIG from '@/config'

interface VoiceInterfaceProps {
  onTranscript: (text: string) => void
  onError: (error: Error) => void
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscript,
  onError,
}) => {
  const [whisperService] = useState(() => new WhisperService(CONFIG.OPENAI_API_KEY))
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    return () => {
      whisperService.cancelRecording().catch(console.error)
    }
  }, [])

  const handlePress = async () => {
    try {
      if (isRecording) {
        setIsProcessing(true)
        setIsRecording(false)
        const transcript = await whisperService.stopRecording()
        onTranscript(transcript)
      } else {
        await whisperService.startRecording()
        setIsRecording(true)
      }
    } catch (error) {
      onError(error as Error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recording,
          Platform.select({
            ios: styles.iosShadow,
            android: styles.androidShadow,
          }),
        ]}
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.background} size="large" />
        ) : (
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color={colors.background}
          />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    backgroundColor: colors.error,
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  androidShadow: {
    elevation: 5,
  },
})
