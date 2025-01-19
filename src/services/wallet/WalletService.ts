import { ethers } from 'ethers'
import * as SecureStore from 'expo-secure-store'
import { blockchainService } from '../blockchain/BlockchainService'
import * as Sentry from '@sentry/react-native'
import { create } from 'zustand'

interface WalletState {
  address: string | null
  balance: string | null
  network: string | null
  isConnected: boolean
  supportedTokens: Token[]
}

interface Token {
  symbol: string
  address: string
  decimals: number
  balance: string
}

interface WalletStore extends WalletState {
  setAddress: (address: string | null) => void
  setBalance: (balance: string | null) => void
  setNetwork: (network: string | null) => void
  setIsConnected: (isConnected: boolean) => void
  setSupportedTokens: (tokens: Token[]) => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  balance: null,
  network: null,
  isConnected: false,
  supportedTokens: [],
  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setNetwork: (network) => set({ network }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setSupportedTokens: (tokens) => set({ supportedTokens: tokens }),
}))

class WalletService {
  private provider: ethers.providers.JsonRpcProvider
  private wallet: ethers.Wallet | null = null

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_PROVIDER_URL
    )
  }

  async createWallet(): Promise<{ address: string; mnemonic: string }> {
    try {
      const wallet = ethers.Wallet.createRandom()
      const mnemonic = wallet.mnemonic.phrase
      const address = wallet.address

      // Encrypt and store the private key
      await this.storePrivateKey(wallet.privateKey)

      useWalletStore.getState().setAddress(address)
      useWalletStore.getState().setIsConnected(true)

      return { address, mnemonic }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WalletService', method: 'createWallet' },
      })
      throw new Error('Failed to create wallet')
    }
  }

  async importWallet(mnemonic: string): Promise<string> {
    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic)
      const address = wallet.address

      // Encrypt and store the private key
      await this.storePrivateKey(wallet.privateKey)

      useWalletStore.getState().setAddress(address)
      useWalletStore.getState().setIsConnected(true)

      return address
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WalletService', method: 'importWallet' },
      })
      throw new Error('Failed to import wallet')
    }
  }

  async connectWallet(): Promise<void> {
    try {
      const privateKey = await this.getPrivateKey()
      if (!privateKey) throw new Error('No wallet found')

      this.wallet = new ethers.Wallet(privateKey, this.provider)
      await blockchainService.connectWallet(privateKey)

      const address = this.wallet.address
      const balance = ethers.utils.formatEther(
        await this.provider.getBalance(address)
      )
      const network = await this.provider.getNetwork()

      useWalletStore.getState().setAddress(address)
      useWalletStore.getState().setBalance(balance)
      useWalletStore.getState().setNetwork(network.name)
      useWalletStore.getState().setIsConnected(true)

      // Start listening to balance changes
      this.startBalanceListener()
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WalletService', method: 'connectWallet' },
      })
      throw new Error('Failed to connect wallet')
    }
  }

  async disconnectWallet(): Promise<void> {
    this.wallet = null
    useWalletStore.getState().setAddress(null)
    useWalletStore.getState().setBalance(null)
    useWalletStore.getState().setNetwork(null)
    useWalletStore.getState().setIsConnected(false)
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    try {
      if (!this.wallet) throw new Error('Wallet not connected')

      const tx = await this.wallet.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      })

      await tx.wait()
      return tx.hash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WalletService', method: 'sendTransaction' },
        extra: { to, amount },
      })
      throw new Error('Failed to send transaction')
    }
  }

  async getGasEstimate(to: string, amount: string): Promise<string> {
    try {
      if (!this.wallet) throw new Error('Wallet not connected')

      const gasPrice = await this.provider.getGasPrice()
      const gasLimit = await this.provider.estimateGas({
        to,
        value: ethers.utils.parseEther(amount),
      })

      return ethers.utils.formatEther(gasPrice.mul(gasLimit))
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'WalletService', method: 'getGasEstimate' },
        extra: { to, amount },
      })
      throw new Error('Failed to estimate gas')
    }
  }

  private async storePrivateKey(privateKey: string): Promise<void> {
    const encryptedKey = await this.encryptPrivateKey(privateKey)
    await SecureStore.setItemAsync('wallet_private_key', encryptedKey)
  }

  private async getPrivateKey(): Promise<string | null> {
    const encryptedKey = await SecureStore.getItemAsync('wallet_private_key')
    if (!encryptedKey) return null
    return this.decryptPrivateKey(encryptedKey)
  }

  private async encryptPrivateKey(privateKey: string): Promise<string> {
    // Implement encryption logic here
    return privateKey // TODO: Add proper encryption
  }

  private async decryptPrivateKey(encryptedKey: string): Promise<string> {
    // Implement decryption logic here
    return encryptedKey // TODO: Add proper decryption
  }

  private startBalanceListener() {
    if (!this.wallet) return

    this.provider.on(this.wallet.address, (balance) => {
      useWalletStore
        .getState()
        .setBalance(ethers.utils.formatEther(balance))
    })
  }
}

export const walletService = new WalletService()
