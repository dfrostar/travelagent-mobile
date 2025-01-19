import { ethers } from 'ethers'
import { blockchainService } from '../blockchain/BlockchainService'
import { walletService } from './WalletService'
import * as Sentry from '@sentry/react-native'

interface SwapQuote {
  inputAmount: string
  outputAmount: string
  priceImpact: string
  route: string[]
  gasEstimate: string
}

interface SwapResult {
  transactionHash: string
  inputAmount: string
  outputAmount: string
  timestamp: number
}

class TokenSwapService {
  private readonly UNISWAP_ROUTER = process.env.UNISWAP_ROUTER_ADDRESS!
  private readonly SUPPORTED_TOKENS = {
    ETH: {
      symbol: 'ETH',
      address: 'ETH',
      decimals: 18,
    },
    USDC: {
      symbol: 'USDC',
      address: process.env.USDC_TOKEN_ADDRESS!,
      decimals: 6,
    },
    DAI: {
      symbol: 'DAI',
      address: process.env.DAI_TOKEN_ADDRESS!,
      decimals: 18,
    },
    USDT: {
      symbol: 'USDT',
      address: process.env.USDT_TOKEN_ADDRESS!,
      decimals: 6,
    },
  }

  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapQuote> {
    try {
      const fromTokenData = this.SUPPORTED_TOKENS[fromToken]
      const toTokenData = this.SUPPORTED_TOKENS[toToken]

      if (!fromTokenData || !toTokenData) {
        throw new Error('Unsupported token')
      }

      // Get quote from Uniswap SDK
      const quote = await this.fetchUniswapQuote(
        fromTokenData.address,
        toTokenData.address,
        amount
      )

      return {
        inputAmount: amount,
        outputAmount: quote.outputAmount,
        priceImpact: quote.priceImpact,
        route: quote.route,
        gasEstimate: quote.gasEstimate,
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TokenSwapService', method: 'getSwapQuote' },
        extra: { fromToken, toToken, amount },
      })
      throw new Error('Failed to get swap quote')
    }
  }

  async executeSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    slippageTolerance: number = 0.5
  ): Promise<SwapResult> {
    try {
      const fromTokenData = this.SUPPORTED_TOKENS[fromToken]
      const toTokenData = this.SUPPORTED_TOKENS[toToken]

      if (!fromTokenData || !toTokenData) {
        throw new Error('Unsupported token')
      }

      // Get quote first
      const quote = await this.getSwapQuote(fromToken, toToken, amount)

      // Calculate minimum output amount with slippage tolerance
      const minOutputAmount = this.calculateMinOutputAmount(
        quote.outputAmount,
        slippageTolerance
      )

      // Execute swap through Uniswap router
      const tx = await this.executeUniswapSwap(
        fromTokenData.address,
        toTokenData.address,
        amount,
        minOutputAmount
      )

      const receipt = await tx.wait()

      return {
        transactionHash: receipt.transactionHash,
        inputAmount: amount,
        outputAmount: quote.outputAmount,
        timestamp: Date.now(),
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TokenSwapService', method: 'executeSwap' },
        extra: { fromToken, toToken, amount, slippageTolerance },
      })
      throw new Error('Failed to execute swap')
    }
  }

  async approveToken(
    tokenAddress: string,
    amount: string
  ): Promise<string> {
    try {
      const tx = await this.approveUniswapRouter(tokenAddress, amount)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'TokenSwapService', method: 'approveToken' },
        extra: { tokenAddress, amount },
      })
      throw new Error('Failed to approve token')
    }
  }

  private async fetchUniswapQuote(
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<any> {
    // Implementation would use Uniswap SDK to get actual quote
    // This is a placeholder implementation
    return {
      outputAmount: amount,
      priceImpact: '0.5',
      route: [fromToken, toToken],
      gasEstimate: '150000',
    }
  }

  private async executeUniswapSwap(
    fromToken: string,
    toToken: string,
    amount: string,
    minOutputAmount: string
  ): Promise<ethers.ContractTransaction> {
    // Implementation would use Uniswap Router contract
    // This is a placeholder implementation
    const tx = await blockchainService.contract.swapExactTokensForTokens(
      amount,
      minOutputAmount,
      [fromToken, toToken],
      walletService.getAddress(),
      Math.floor(Date.now() / 1000) + 60 * 20 // 20 minute deadline
    )
    return tx
  }

  private async approveUniswapRouter(
    tokenAddress: string,
    amount: string
  ): Promise<ethers.ContractTransaction> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      blockchainService.provider
    )

    return tokenContract.approve(this.UNISWAP_ROUTER, amount)
  }

  private calculateMinOutputAmount(
    outputAmount: string,
    slippageTolerance: number
  ): string {
    const output = ethers.BigNumber.from(outputAmount)
    const slippage = output.mul(Math.floor(slippageTolerance * 100)).div(10000)
    return output.sub(slippage).toString()
  }

  getSupportedTokens() {
    return Object.values(this.SUPPORTED_TOKENS)
  }
}

export const tokenSwapService = new TokenSwapService()
