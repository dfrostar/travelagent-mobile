import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TokenInput } from '../TokenInput'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '@/tamagui.config'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <TamaguiProvider config={config}>
      <Theme name="light">{component}</Theme>
    </TamaguiProvider>
  )
}

describe('TokenInput', () => {
  const mockOnChangeText = jest.fn()
  const mockOnSelectToken = jest.fn()

  const defaultProps = {
    value: '100',
    onChangeText: mockOnChangeText,
    maxAmount: '1000',
    symbol: 'TRAVL',
    onSelectToken: mockOnSelectToken,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <TokenInput {...defaultProps} />
    )

    expect(getByText('TRAVL')).toBeTruthy()
    expect(getByText('Balance: 1,000')).toBeTruthy()
    expect(getByPlaceholderText('0.00')).toBeTruthy()
  })

  it('handles max button press', () => {
    const { getByText } = renderWithProvider(<TokenInput {...defaultProps} />)

    fireEvent.press(getByText('MAX'))
    expect(mockOnChangeText).toHaveBeenCalledWith('1000')
  })

  it('handles token selection', () => {
    const { getByText } = renderWithProvider(<TokenInput {...defaultProps} />)

    fireEvent.press(getByText('TRAVL'))
    expect(mockOnSelectToken).toHaveBeenCalled()
  })

  it('validates numeric input', () => {
    const { getByPlaceholderText } = renderWithProvider(
      <TokenInput {...defaultProps} />
    )

    const input = getByPlaceholderText('0.00')
    
    // Valid inputs
    fireEvent.changeText(input, '123.45')
    expect(mockOnChangeText).toHaveBeenCalledWith('123.45')

    fireEvent.changeText(input, '0.5')
    expect(mockOnChangeText).toHaveBeenCalledWith('0.5')

    // Invalid inputs
    fireEvent.changeText(input, 'abc')
    expect(mockOnChangeText).not.toHaveBeenCalledWith('abc')

    fireEvent.changeText(input, '1.2.3')
    expect(mockOnChangeText).not.toHaveBeenCalledWith('1.2.3')
  })

  it('shows insufficient balance warning', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <TokenInput {...defaultProps} value="1500" />
    )

    expect(getByText('Insufficient balance')).toBeTruthy()
  })

  it('disables input when disabled prop is true', () => {
    const { getByPlaceholderText } = renderWithProvider(
      <TokenInput {...defaultProps} disabled />
    )

    const input = getByPlaceholderText('0.00')
    expect(input.props.editable).toBeFalsy()
  })
})
