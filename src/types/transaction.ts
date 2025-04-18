import { Address, Hash } from 'viem';

export interface TransactionRequest {
  from: Address;
  to: Address;
  value: bigint;
  data?: `0x${string}`;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  chainId?: number;
}

export interface TransactionReceipt {
  transactionHash: Hash;
  blockHash: Hash;
  blockNumber: bigint;
  from: Address;
  to: Address | null;
  contractAddress: Address | null;
  transactionIndex: number;
  gasUsed: bigint;
  logs: {
    address: Address;
    topics: Hash[];
    data: `0x${string}`;
  }[];
  status: 'success' | 'reverted';
  effectiveGasPrice: bigint;
  cumulativeGasUsed: bigint;
  type: 'legacy' | 'eip2930' | 'eip1559';
} 