import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import OpenAI from 'openai';

export interface SpeechConfig {
  apiKey: string;
  language?: string;
  model?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export class ExpoSpeechService {
  private openai: OpenAI;
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private config: SpeechConfig;
  private audioUri: string | null = null;

  constructor(config: SpeechConfig) {
    this.config = {
      model: 'whisper-1',
      language: 'en',
      temperature: 0,
      responseFormat: 'json',
      ...config
    };
    
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
    });

    // Initialize audio
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });
  }

  private async requestPermissions(): Promise<boolean> {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    return status === 'granted';
  }

  public async startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void
  ): Promise<void> {
    if (this.isRecording) {
      throw new Error('already_recording');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('not_allowed');
    }

    try {
      this.isRecording = true;

      // Create recording object
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      // Start recording
      await this.recording.startAsync();

      // Process interim results every 3 seconds
      const processInterim = async () => {
        if (this.isRecording && this.recording) {
          try {
            const status = await this.recording.getStatusAsync();
            if (status.isDoneRecording) {
              const uri = this.recording.getURI();
              if (uri) {
                const text = await this.transcribeAudioFile(uri);
                onInterim(text);
              }
            }
          } catch (error) {
            console.error('Interim processing error:', error);
          }
        }
      };

      const intervalId = setInterval(processInterim, 3000);

      // Clean up interval when recording stops
      this.recording.setOnRecordingStatusUpdate((status) => {
        if (status.isDoneRecording) {
          clearInterval(intervalId);
        }
      });

    } catch (error) {
      this.isRecording = false;
      this.cleanup();
      throw error;
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.isRecording || !this.recording) {
      return;
    }

    try {
      this.isRecording = false;
      
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      
      // Get the recorded file URI
      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('No recording URI available');
      }
      
      // Transcribe the final audio
      const text = await this.transcribeAudioFile(uri);
      
      // Clean up
      await this.cleanup();

      return text;
    } catch (error) {
      console.error('Stop recording error:', error);
      await this.cleanup();
      throw error;
    }
  }

  private async transcribeAudioFile(uri: string): Promise<string> {
    try {
      // Create a blob from the file
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to file
      const file = new File([blob], 'audio.m4a', {
        type: 'audio/m4a'
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file,
        model: this.config.model!,
        language: this.config.language,
        temperature: this.config.temperature,
        response_format: this.config.responseFormat
      });

      if (typeof transcription === 'string') {
        return transcription;
      } else if ('text' in transcription) {
        return transcription.text;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  public async speak(text: string): Promise<void> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
      });

      const audioData = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioData).toString('base64');
      
      // Save the audio file
      const audioUri = FileSystem.documentDirectory + 'speech.mp3';
      await FileSystem.writeAsStringAsync(audioUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      // Clean up after playback
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
          await FileSystem.deleteAsync(audioUri);
        }
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('tts_failed');
    }
  }

  private async cleanup(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }

    if (this.audioUri) {
      try {
        await FileSystem.deleteAsync(this.audioUri);
        this.audioUri = null;
      } catch (error) {
        console.error('Error cleaning up audio file:', error);
      }
    }
  }
}
