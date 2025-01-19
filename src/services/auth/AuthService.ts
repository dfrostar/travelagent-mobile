import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from '../api/queries'
import * as Keychain from 'react-native-keychain'
import { Platform } from 'react-native'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserCredentials {
  email: string
  password: string
}

class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token'
  private static readonly USER_KEY = 'auth_user'

  async login(credentials: UserCredentials): Promise<void> {
    try {
      const { data } = await apiClient.post<AuthTokens>('/auth/login', credentials)
      await this.storeTokens(data)
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.')
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
      await this.clearTokens()
    } catch (error) {
      // Still clear tokens even if logout API fails
      await this.clearTokens()
      throw new Error('Logout failed. Please try again.')
    }
  }

  async refreshTokens(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const { data } = await apiClient.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      })
      await this.storeTokens(data)
    } catch (error) {
      await this.clearTokens()
      throw new Error('Session expired. Please login again.')
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const credentials = await Keychain.getGenericPassword(this.ACCESS_TOKEN_KEY)
        return credentials ? credentials.password : null
      } catch {
        return null
      }
    } else {
      return AsyncStorage.getItem(this.ACCESS_TOKEN_KEY)
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const credentials = await Keychain.getGenericPassword(this.REFRESH_TOKEN_KEY)
        return credentials ? credentials.password : null
      } catch {
        return null
      }
    } else {
      return AsyncStorage.getItem(this.REFRESH_TOKEN_KEY)
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Keychain.setGenericPassword(
        this.ACCESS_TOKEN_KEY,
        tokens.accessToken
      )
      await Keychain.setGenericPassword(
        this.REFRESH_TOKEN_KEY,
        tokens.refreshToken
      )
    } else {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
    }
  }

  private async clearTokens(): Promise<void> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Keychain.resetGenericPassword()
    } else {
      await AsyncStorage.multiRemove([
        this.ACCESS_TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_KEY,
      ])
    }
  }
}

export const authService = new AuthService()
