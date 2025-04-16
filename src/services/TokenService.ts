import { createWalletClient, custom, parseUnits, type Address, type Hash } from 'viem'
import { type ChainConfig } from '../core/chain/ChainAdapter'

export interface Token {
  address: Address
  symbol: string
  decimals: number
  balance: bigint
}

export class TokenService {
  private client: ReturnType<typeof createWalletClient>

  constructor(network: ChainConfig) {
    if (!window.ethereum) throw new Error('No ethereum provider found')
    
    this.client = createWalletClient({
      chain: network.chain,
      transport: custom(window.ethereum)
    })
  }

  async getTokenBalance(tokenAddress: Address, walletAddress: Address): Promise<bigint> {
    try {
      const data = await this.client.readContract({
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
      
      const hash = await this.client.writeContract({
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
        }],
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
      
      const hash = await this.client.writeContract({
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
        }],
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
      const data = await this.client.readContract({
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