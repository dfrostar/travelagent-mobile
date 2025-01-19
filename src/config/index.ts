// Environment variables with type safety
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3000',
  AI_MODEL_VERSION: process.env.AI_MODEL_VERSION || 'v1',
  MAX_RETRIES: 3,
  TIMEOUT_MS: 10000,
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000, // 1 minute
  },
  SENTRY_DSN: process.env.SENTRY_DSN,
} as const

// Validate required environment variables
const validateConfig = () => {
  const required = ['API_URL', 'SENTRY_DSN']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Only validate in development
if (__DEV__) {
  validateConfig()
}

export default CONFIG
