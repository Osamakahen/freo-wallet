import { createPublicClient, http, type Address, type Hash, type TransactionRequest, type WalletClient, type Chain, type PublicClient } from 'viem'
import { ChainAdapter, type TransactionDetails } from './ChainAdapter'
import { ChainConfig } from '../config/ChainConfig'
import { EVMChain } from './EVMChain'
import { WalletError } from '../error/ErrorHandler'

export class EVMAdapter extends ChainAdapter {
  protected publicClient: PublicClient;
  protected chain: EVMChain;
  protected client: WalletClient | null = null;

  constructor(config: ChainConfig) {
    super(config);
    this.chain = new EVMChain(config.chainId);
    const chainConfig = {
      id: config.chainId,
      name: config.name,
      nativeCurrency: {
        name: config.name,
        symbol: config.symbol,
        decimals: 18
      },
      rpcUrls: {
        default: { http: [config.rpcUrl] },
        public: { http: [config.rpcUrl] }
      },
      blockExplorers: config.blockExplorer ? {
        default: { name: 'Explorer', url: config.blockExplorer }
      } : undefined
    } satisfies Chain;

    this.publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(config.rpcUrl)
    });
  }

  setClient(client: WalletClient): void {
    this.client = client;
  }

  getChainId(): number {
    return this.config.chainId;
  }

  getClient(): WalletClient | null {
    return this.client;
  }

  async getBalance(address: Address): Promise<bigint> {
    return await this.publicClient.getBalance({ address })
  }

  async prepareTransaction(tx: TransactionDetails): Promise<TransactionRequest> {
    if (!this.client) throw new Error('Wallet client not set')

    const nonce = tx.nonce ?? await this.getNonce(await this.client.getAddresses().then((addrs: Address[]) => addrs[0]))
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
      type: 'eip1559'
    }
  }

  async broadcastTransaction(signedTx: `0x${string}`): Promise<Hash> {
    return await this.publicClient.sendRawTransaction({ serializedTransaction: signedTx })
  }

  async estimateGas(tx: TransactionDetails): Promise<bigint> {
    if (!this.client) throw new Error('Wallet client not set')
    const address = await this.client.getAddresses().then((addrs: Address[]) => addrs[0])

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

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    try {
      return await this.chain.sendTransaction(tx)
    } catch (error) {
      throw new WalletError('Failed to send transaction', 'TRANSACTION_ERROR', { error })
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      return await this.chain.getTransactionReceipt(txHash)
    } catch (error) {
      throw new WalletError('Failed to get transaction receipt', 'RECEIPT_FETCH_ERROR', { error })
    }
  }

  getExplorer(): string | undefined {
    return this.config.blockExplorer || this.config.explorer;
  }
} 