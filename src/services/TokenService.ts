import { createWalletClient, createPublicClient, custom, parseUnits, type Address, type Hash, http, type Chain } from 'viem'
import { type ChainConfig } from '../core/chain/ChainAdapter'

export interface Token {
  address: Address
  symbol: string
  decimals: number
  balance: bigint
}

export class TokenService {
  private walletClient: ReturnType<typeof createWalletClient>
  private publicClient: ReturnType<typeof createPublicClient>
  private chain: Chain

  constructor(network: ChainConfig) {
    if (!window.ethereum) throw new Error('No ethereum provider found')
    
    this.chain = {
      id: network.chainId,
      name: network.name,
      network: network.name,
      nativeCurrency: network.nativeCurrency || {
        name: network.symbol,
        symbol: network.symbol,
        decimals: 18
      },
      rpcUrls: {
        default: { http: [network.rpcUrl] },
        public: { http: [network.rpcUrl] }
      },
      blockExplorers: network.explorer ? {
        default: {
          name: network.name,
          url: network.explorer
        }
      } : undefined
    } as Chain

    this.walletClient = createWalletClient({
      chain: this.chain,
      transport: custom(window.ethereum)
    })

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http()
    })
  }

  async getTokenBalance(tokenAddress: Address, walletAddress: Address): Promise<bigint> {
    try {
      const data = await this.publicClient.readContract({
        address: tokenAddress,
        abi: [{
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function'
        }],
        functionName: 'balanceOf',
        args: [walletAddress]
      })

      return data as bigint
    } catch (error) {
      console.error('Error getting token balance:', error)
      throw error
    }
  }

  async sendToken(
    tokenAddress: Address,
    to: Address,
    amount: string,
    decimals: number
  ): Promise<Hash> {
    try {
      const value = parseUnits(amount, decimals)
      
      const [account] = await this.walletClient.getAddresses()
      const hash = await this.walletClient.writeContract({
        account,
        chain: this.chain,
        address: tokenAddress,
        abi: [{
          constant: false,
          inputs: [
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' }
          ],
          name: 'transfer',
          outputs: [{ name: '', type: 'bool' }],
          type: 'function'
        }] as const,
        functionName: 'transfer',
        args: [to, value]
      })

      return hash
    } catch (error) {
      console.error('Error sending token:', error)
      throw error
    }
  }

  async approveToken(
    tokenAddress: Address,
    spender: Address,
    amount: string,
    decimals: number
  ): Promise<Hash> {
    try {
      const value = parseUnits(amount, decimals)
      
      const [account] = await this.walletClient.getAddresses()
      const hash = await this.walletClient.writeContract({
        account,
        chain: this.chain,
        address: tokenAddress,
        abi: [{
          constant: false,
          inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          type: 'function'
        }] as const,
        functionName: 'approve',
        args: [spender, value]
      })

      return hash
    } catch (error) {
      console.error('Error approving token:', error)
      throw error
    }
  }

  async getAllowance(
    tokenAddress: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> {
    try {
      const data = await this.publicClient.readContract({
        address: tokenAddress,
        abi: [{
          constant: true,
          inputs: [
            { name: '_owner', type: 'address' },
            { name: '_spender', type: 'address' }
          ],
          name: 'allowance',
          outputs: [{ name: '', type: 'uint256' }],
          type: 'function'
        }],
        functionName: 'allowance',
        args: [owner, spender]
      })

      return data as bigint
    } catch (error) {
      console.error('Error getting allowance:', error)
      throw error
    }
  }
} 