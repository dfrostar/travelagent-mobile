import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react-native'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '@/tamagui.config'

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={config}>
          <Theme name="light">
            <NavigationContainer>{children}</NavigationContainer>
          </Theme>
        </TamaguiProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock data generators
export const mockToken = {
  symbol: 'TRAVL',
  address: '0x1234567890123456789012345678901234567890',
  decimals: 18,
  balance: '1000000000000000000',
}

export const mockTokenMetrics = {
  marketCap: '1000000',
  circulatingSupply: '10000000',
  totalStaked: '5000000',
  stakingAPR: '5.00',
  totalHolders: 1000,
}

export const mockReward = {
  title: 'Staking Rewards',
  icon: 'lock-closed',
  amount: '1000',
  description: 'Rewards from staking TRAVL tokens',
  color: '#00ff00',
}

// Test utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Mock blockchain service responses
export const mockBlockchainResponse = {
  getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
  stake: jest.fn().mockResolvedValue('0x123...'),
  unstake: jest.fn().mockResolvedValue('0x456...'),
  claimRewards: jest.fn().mockResolvedValue('0x789...'),
}

// Helper to simulate blockchain events
export const simulateBlockchainEvent = (eventName: string, data: any) => {
  const event = new CustomEvent(eventName, { detail: data })
  window.dispatchEvent(event)
}

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock route
export const mockRoute = {
  params: {},
}

export * from '@testing-library/react-native'
