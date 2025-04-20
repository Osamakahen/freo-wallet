import { createPublicClient, createWalletClient, http, custom, type Address, type Hash, type Chain } from 'viem'
import { type ChainConfig } from '../core/chain/ChainAdapter'

export interface Transaction {
  hash: Hash
  from: Address
  to: Address
  value: bigint
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  gasUsed?: bigint
  gasPrice?: bigint
}

export class TransactionService {
  private client: ReturnType<typeof createPublicClient>
  private walletClient: ReturnType<typeof createWalletClient>
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

    this.client = createPublicClient({
      chain: this.chain,
      transport: http()
    })

    this.walletClient = createWalletClient({
      chain: this.chain,
      transport: custom(window.ethereum)
    })
  }

  async getTransactions(address: Address): Promise<Transaction[]> {
    try {
      const blockNumber = await this.client.getBlockNumber()
      const fromBlock = blockNumber - BigInt(10000) // Last 10000 blocks
      
      const [sent, received] = await Promise.all([
        this.client.getLogs({
          address,
          fromBlock,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value' }
            ]
          }
        }),
        this.client.getLogs({
          address,
          fromBlock,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value' }
            ]
          }
        })
      ])

      const transactions = await Promise.all([...sent, ...received].map(async (log) => {
        const block = await this.client.getBlock({ blockHash: log.blockHash! })
        const receipt = await this.client.getTransactionReceipt({ hash: log.transactionHash })

        return {
          hash: log.transactionHash,
          from: log.args.from as Address,
          to: log.args.to as Address,
          value: log.args.value as bigint,
          status: receipt.status ? 'confirmed' : 'failed' as 'confirmed' | 'failed',
          timestamp: Number(block.timestamp) * 1000,
          gasUsed: receipt.gasUsed,
          gasPrice: receipt.effectiveGasPrice
        }
      }))

      return transactions.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  async sendTransaction(transaction: {
    to: Address
    value: bigint
    data?: `0x${string}`
  }): Promise<Hash> {
    try {
      const [account] = await this.walletClient.getAddresses()
      const hash = await this.walletClient.sendTransaction({
        account,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        chain: this.chain,
        type: 'eip1559'
      })
      return hash
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  async getTransactionStatus(hash: Hash): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const receipt = await this.client.getTransactionReceipt({ hash })
      return receipt.status ? 'confirmed' : 'failed'
    } catch (error) {
      return 'pending'
    }
  }
} 