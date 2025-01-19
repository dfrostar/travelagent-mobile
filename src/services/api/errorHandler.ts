import { AxiosError } from 'axios'
import * as Sentry from '@sentry/react-native'
import { authService } from '../auth/AuthService'

export interface ApiError {
  code: string
  message: string
  userMessage: string
}

export class ApiErrorHandler {
  static async handle(error: AxiosError): Promise<ApiError> {
    // Log error to Sentry
    Sentry.captureException(error, {
      extra: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
      },
    })

    // Handle authentication errors
    if (error.response?.status === 401) {
      try {
        await authService.refreshTokens()
        return {
          code: 'AUTH_REFRESH',
          message: 'Authentication refreshed',
          userMessage: 'Please try your request again',
        }
      } catch (refreshError) {
        return {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          userMessage: 'Please log in again to continue',
        }
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: 'Too many requests',
        userMessage: 'Please wait a moment before trying again',
      }
    }

    // Handle server errors
    if (error.response?.status && error.response.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: `Server error: ${error.response.status}`,
        userMessage: 'Our servers are having trouble. Please try again later',
      }
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connectivity issue',
        userMessage: 'Please check your internet connection and try again',
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out',
        userMessage: 'The request took too long. Please try again',
      }
    }

    // Handle validation errors
    if (error.response?.status === 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.response.data?.message || 'Validation error',
        userMessage: 'Please check your input and try again',
      }
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again',
    }
  }
}

export const handleApiError = ApiErrorHandler.handle
