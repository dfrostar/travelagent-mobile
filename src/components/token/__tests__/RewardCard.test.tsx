import React from 'react'
import { render } from '@testing-library/react-native'
import { RewardCard } from '../RewardCard'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '@/tamagui.config'
import { theme } from '@/theme'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <TamaguiProvider config={config}>
      <Theme name="light">{component}</Theme>
    </TamaguiProvider>
  )
}

describe('RewardCard', () => {
  const defaultProps = {
    title: 'Staking Rewards',
    icon: 'lock-closed',
    amount: '1000',
    description: 'Rewards from staking TRAVL tokens',
    color: theme.colors.success,
  }

  it('renders correctly', () => {
    const { getByText } = renderWithProvider(<RewardCard {...defaultProps} />)

    expect(getByText('Staking Rewards')).toBeTruthy()
    expect(getByText('Rewards from staking TRAVL tokens')).toBeTruthy()
    expect(getByText('1,000')).toBeTruthy()
    expect(getByText('TRAVL')).toBeTruthy()
  })

  it('formats large numbers correctly', () => {
    const props = {
      ...defaultProps,
      amount: '1000000',
    }
    const { getByText } = renderWithProvider(<RewardCard {...props} />)

    expect(getByText('1,000,000')).toBeTruthy()
  })

  it('handles zero amount', () => {
    const props = {
      ...defaultProps,
      amount: '0',
    }
    const { getByText } = renderWithProvider(<RewardCard {...props} />)

    expect(getByText('0')).toBeTruthy()
  })

  it('applies correct accessibility props', () => {
    const { getByRole } = renderWithProvider(<RewardCard {...defaultProps} />)

    const card = getByRole('button')
    expect(card.props.accessibilityLabel).toBe(
      'Staking Rewards: 1,000 TRAVL'
    )
    expect(card.props.accessibilityHint).toBe(
      'Rewards from staking TRAVL tokens'
    )
  })
})
