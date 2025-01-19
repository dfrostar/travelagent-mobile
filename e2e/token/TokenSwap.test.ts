import { device, element, by, expect } from 'detox'

describe('Token Swap Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await element(by.text('Tokens')).tap()
    await element(by.text('Swap')).tap()
  })

  it('should display swap screen elements', async () => {
    await expect(element(by.text('Swap Tokens'))).toBeVisible()
    await expect(element(by.text('From'))).toBeVisible()
    await expect(element(by.text('To'))).toBeVisible()
    await expect(element(by.text('ETH'))).toBeVisible()
    await expect(element(by.text('TRAVL'))).toBeVisible()
  })

  it('should handle token selection', async () => {
    await element(by.text('ETH')).tap()
    await expect(element(by.text('Select Token'))).toBeVisible()
    await element(by.text('USDC')).tap()
    await expect(element(by.text('USDC'))).toBeVisible()
  })

  it('should calculate swap rate', async () => {
    await element(by.placeholder('0.00')).typeText('1')
    await expect(element(by.text('Rate'))).toBeVisible()
    await expect(element(by.text(/1 ETH ≈ [0-9.]+ TRAVL/))).toBeVisible()
  })

  it('should handle token switch', async () => {
    const fromToken = await element(by.text('ETH')).getText()
    const toToken = await element(by.text('TRAVL')).getText()
    await element(by.id('switchTokens')).tap()
    await expect(element(by.text(toToken))).toBeVisible()
    await expect(element(by.text(fromToken))).toBeVisible()
  })

  it('should show price impact warning', async () => {
    await element(by.placeholder('0.00')).typeText('1000')
    await expect(element(by.text(/Price Impact/))).toBeVisible()
    await expect(element(by.text(/High impact/))).toBeVisible()
    await element(by.text('Swap Tokens')).tap()
    await expect(element(by.text('Price impact is high'))).toBeVisible()
  })

  it('should handle slippage settings', async () => {
    await element(by.id('settings')).tap()
    await expect(element(by.text('Slippage Tolerance'))).toBeVisible()
    await element(by.text('1.0%')).tap()
    await element(by.text('Confirm')).tap()
    await expect(element(by.text('1.0%'))).toBeVisible()
  })

  it('should complete swap transaction', async () => {
    await element(by.placeholder('0.00')).typeText('0.1')
    await element(by.text('Swap Tokens')).tap()
    await element(by.text('Confirm')).tap()
    await expect(element(by.text('Swap completed successfully'))).toBeVisible()
  })
})
