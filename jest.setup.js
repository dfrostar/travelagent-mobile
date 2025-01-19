import '@testing-library/jest-native/extend-expect'
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import { cleanup } from '@testing-library/react-native'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock environment variables
process.env = {
  ...process.env,
  APP_ENV: 'test',
  API_URL: 'http://test-api.travelagent.com',
  BLOCKCHAIN_PROVIDER_URL: 'http://test-eth.infura.io/v3/',
  ENABLE_STAKING: 'true',
  ENABLE_SWAPPING: 'true',
  ENABLE_REWARDS: 'true',
}

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    providers: {
      JsonRpcProvider: jest.fn(),
    },
    Contract: jest.fn(),
    utils: {
      formatEther: jest.fn(),
      parseEther: jest.fn(),
    },
  },
}))

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
}))

// Cleanup after each test
afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

// Console error/warning mocks
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalError.call(console, ...args)
  }
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
