import { device, element, by, expect } from 'detox'

describe('Token Staking Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await element(by.text('Tokens')).tap()
    await element(by.text('Stake')).tap()
  })

  it('should display staking screen elements', async () => {
    await expect(element(by.text('Stake TRAVL'))).toBeVisible()
    await expect(element(by.text('Amount'))).toBeVisible()
    await expect(element(by.text('Auto-compound rewards'))).toBeVisible()
    await expect(element(by.text('Staking Period'))).toBeVisible()
  })

  it('should handle valid staking amount', async () => {
    await element(by.placeholder('0.00')).typeText('100')
    await element(by.text('30 Days')).tap()
    await element(by.text('Stake TRAVL')).tap()
    await expect(element(by.text('Confirm Staking'))).toBeVisible()
    await element(by.text('Confirm')).tap()
    await expect(element(by.text('Successfully staked TRAVL tokens'))).toBeVisible()
  })

  it('should validate insufficient balance', async () => {
    await element(by.placeholder('0.00')).typeText('1000000')
    await expect(element(by.text('Insufficient balance'))).toBeVisible()
    await expect(element(by.text('Stake TRAVL'))).toBeDisabled()
  })

  it('should handle auto-compound toggle', async () => {
    await element(by.id('compound')).tap()
    await expect(element(by.text('Rewards will be claimable manually'))).toBeVisible()
    await element(by.id('compound')).tap()
    await expect(element(by.text('Rewards will be automatically restaked monthly'))).toBeVisible()
  })

  it('should calculate rewards correctly', async () => {
    await element(by.placeholder('0.00')).typeText('1000')
    await element(by.text('90 Days')).tap()
    await expect(element(by.text('Est. Rewards'))).toBeVisible()
    const rewardsText = await element(by.text(/[0-9.]+ TRAVL/)).getText()
    expect(parseFloat(rewardsText)).toBeGreaterThan(0)
  })
})
