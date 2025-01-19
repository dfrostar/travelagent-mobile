import { Platform } from 'react-native'

export type Environment = {
  name: string
  apiUrl: string
  blockchainProvider: string
  enableStaking: boolean
  enableSwapping: boolean
  enableRewards: boolean
  apiTimeout: number
  maxRetryAttempts: number
  cacheDuration: number
  maxBatchSize: number
}

const ENV = {
  dev: {
    name: 'Development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    blockchainProvider: process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545',
    enableStaking: process.env.ENABLE_STAKING === 'true',
    enableSwapping: process.env.ENABLE_SWAPPING === 'true',
    enableRewards: process.env.ENABLE_REWARDS === 'true',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000'),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    cacheDuration: parseInt(process.env.CACHE_DURATION || '3600'),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '50'),
  },
  staging: {
    name: 'Staging',
    apiUrl: process.env.API_URL || 'https://staging-api.travelagent.com',
    blockchainProvider: process.env.BLOCKCHAIN_PROVIDER_URL || 'https://staging-eth.infura.io/v3/',
    enableStaking: process.env.ENABLE_STAKING === 'true',
    enableSwapping: process.env.ENABLE_SWAPPING === 'true',
    enableRewards: process.env.ENABLE_REWARDS === 'true',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000'),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    cacheDuration: parseInt(process.env.CACHE_DURATION || '3600'),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '50'),
  },
  prod: {
    name: 'Production',
    apiUrl: process.env.API_URL || 'https://api.travelagent.com',
    blockchainProvider: process.env.BLOCKCHAIN_PROVIDER_URL || 'https://mainnet.infura.io/v3/',
    enableStaking: process.env.ENABLE_STAKING === 'true',
    enableSwapping: process.env.ENABLE_SWAPPING === 'true',
    enableRewards: process.env.ENABLE_REWARDS === 'true',
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000'),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3'),
    cacheDuration: parseInt(process.env.CACHE_DURATION || '3600'),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '50'),
  },
}

const getEnvironment = (): Environment => {
  // Default to 'dev' if not set
  const environment = process.env.APP_ENV || 'dev'

  // Check if the environment exists
  if (!ENV[environment]) {
    console.warn(`Environment ${environment} not found, falling back to dev`)
    return ENV.dev
  }

  if (__DEV__) {
    // Log the current environment in development
    console.log('Current Environment:', ENV[environment])
  }

  return ENV[environment]
}

export const environment = getEnvironment()

// Helper functions to check environment
export const isDevelopment = () => environment.name === 'Development'
export const isStaging = () => environment.name === 'Staging'
export const isProduction = () => environment.name === 'Production'

// Feature flag checks
export const isStakingEnabled = () => environment.enableStaking
export const isSwappingEnabled = () => environment.enableSwapping
export const isRewardsEnabled = () => environment.enableRewards

// Configuration getters
export const getApiTimeout = () => environment.apiTimeout
export const getMaxRetryAttempts = () => environment.maxRetryAttempts
export const getCacheDuration = () => environment.cacheDuration
export const getMaxBatchSize = () => environment.maxBatchSize

export default environment
