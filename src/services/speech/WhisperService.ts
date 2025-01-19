import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import axios from 'axios'
import CONFIG from '@/config'

export class WhisperService {
  private apiKey: string
  private recording: Audio.Recording | null = null
  private isRecording = false

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async startRecording(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      this.recording = recording
      this.isRecording = true
    } catch (error) {
      console.error('Failed to start recording', error)
      throw new Error('Failed to start recording')
    }
  }

  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No recording in progress')
    }

    try {
      await this.recording.stopAndUnloadAsync()
      const uri = this.recording.getURI()
      if (!uri) {
        throw new Error('No recording URI available')
      }

      // Convert audio file to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Send to Whisper API
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          file: base64Audio,
          model: 'whisper-1',
          language: 'en', // Can be made configurable
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      )

      this.recording = null
      this.isRecording = false

      return response.data.text
    } catch (error) {
      console.error('Failed to stop recording or transcribe', error)
      throw new Error('Failed to process audio')
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync()
      } catch (error) {
        console.error('Failed to cancel recording', error)
      }
      this.recording = null
      this.isRecording = false
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }
}
