import { type Address, type Hash, type TransactionRequest, type WalletClient } from 'viem'

export interface TransactionDetails {
  to: Address
  value: bigint
  data?: `0x${string}`
  gasLimit?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: number
}

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer?: string;
  explorer?: string;  // For backward compatibility
  iconUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export abstract class ChainAdapter {
  protected readonly config: ChainConfig
  protected client: WalletClient | null = null

  constructor(config: ChainConfig) {
    this.config = config
  }

  abstract getBalance(address: Address): Promise<bigint>
  abstract prepareTransaction(tx: TransactionDetails): Promise<TransactionRequest>
  abstract broadcastTransaction(signedTx: `0x${string}`): Promise<Hash>
  abstract estimateGas(tx: TransactionDetails): Promise<bigint>
  abstract getNonce(address: Address): Promise<number>
  
  abstract getGasPrice(): Promise<{
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }>

  setClient(client: WalletClient) {
    this.client = client
  }

  getChainId(): number {
    return this.config.chainId
  }

  getExplorer(): string | undefined {
    return this.config.blockExplorer
  }
} 