import { Address } from 'viem';

export interface ChainConfig {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
}

export interface WalletConfig {
  networkName: string;
  chainId: number;
  rpcUrl: string;
}

export interface WalletState {
  isInitialized: boolean;
  isConnected: boolean;
  address: Address | null;
  balance: string;
  chainId: number;
  network: string;
}

export interface TransactionRequest {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  data?: `0x${string}`;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
}

export interface TransactionReceipt {
  hash: string;
  status: 'success' | 'reverted' | 'pending' | 'failed' | 'confirmed';
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: Address;
  to: Address | null;
  contractAddress: Address | null;
  logs: TransactionLog[];
  logsBloom: string;
  gasUsed: string;
  effectiveGasPrice: string;
  cumulativeGasUsed: string;
  type: string;
  timestamp: number;
  value: string;
}

export interface TransactionLog {
  address: Address;
  topics: string[];
  data: string;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  removed: boolean;
}

export interface TokenMetadata {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  price?: number;
}

export interface TokenBalance {
  address: `0x${string}`;
  symbol: string;
  balance: bigint;
  decimals: number;
}

export interface DAppManifest {
  id: string;
  origin: string;
  permissions: DAppPermission[];
  chains: number[];
  name: string;
  description?: string;
  icon?: string;
}

export type DAppPermission = 'read' | 'transaction' | 'message-sign';

export interface SessionToken {
  token: string;
  expiresAt: number;
  deviceFingerprint: string;
  origin: string;
}

export interface ChainAdapter {
  getBalance(address: string): Promise<string>;
  prepareTransaction(tx: TransactionRequest): Promise<TransactionRequest>;
  broadcastTransaction(signedTx: string): Promise<string>;
  estimateGas(tx: TransactionRequest): Promise<string>;
  getNonce(address: string): Promise<number>;
}

export interface SavedAddress {
  address: `0x${string}`;
  name: string;
  label?: string;
  createdAt: number;
} 