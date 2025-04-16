import { createPublicClient, http, type Address, type Hash, type TransactionRequest } from 'viem'
import { ChainAdapter, type TransactionDetails } from './ChainAdapter'

export class EVMAdapter extends ChainAdapter {
  private publicClient = createPublicClient({
    chain: this.config.chain,
    transport: http(this.config.rpcUrl)
  })

  async getBalance(address: Address): Promise<bigint> {
    return await this.publicClient.getBalance({ address })
  }

  async prepareTransaction(tx: TransactionDetails): Promise<TransactionRequest> {
    if (!this.client) throw new Error('Wallet client not set')

    const nonce = tx.nonce ?? await this.getNonce(await this.client.getAddresses().then(addrs => addrs[0]))
    const gasLimit = tx.gasLimit ?? await this.estimateGas(tx)
    const { maxFeePerGas, maxPriorityFeePerGas } = tx.maxFeePerGas && tx.maxPriorityFeePerGas 
      ? { maxFeePerGas: tx.maxFeePerGas, maxPriorityFeePerGas: tx.maxPriorityFeePerGas }
      : await this.getGasPrice()

    return {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      nonce,
      gas: gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId: this.getChainId()
    }
  }

  async broadcastTransaction(signedTx: `0x${string}`): Promise<Hash> {
    return await this.publicClient.sendRawTransaction({ serializedTransaction: signedTx })
  }

  async estimateGas(tx: TransactionDetails): Promise<bigint> {
    if (!this.client) throw new Error('Wallet client not set')
    const address = await this.client.getAddresses().then(addrs => addrs[0])

    return await this.publicClient.estimateGas({
      account: address,
      to: tx.to,
      value: tx.value,
      data: tx.data
    })
  }

  async getNonce(address: Address): Promise<number> {
    return Number(await this.publicClient.getTransactionCount({ address }))
  }

  async getGasPrice(): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
    const block = await this.publicClient.getBlock({ blockTag: 'latest' })
    
    // EIP-1559 gas calculation
    const baseFee = block.baseFeePerGas ?? 0n
    const priorityFee = 1500000000n // 1.5 gwei priority fee
    const maxPriorityFeePerGas = priorityFee
    const maxFeePerGas = baseFee * 2n + priorityFee

    return {
      maxFeePerGas,
      maxPriorityFeePerGas
    }
  }
} 