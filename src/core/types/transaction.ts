export interface TransactionRequest {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  data?: `0x${string}`;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface TransactionReceipt {
  transactionHash: `0x${string}`;
  blockHash: `0x${string}`;
  blockNumber: bigint;
  from: `0x${string}`;
  to: `0x${string}` | null;
  status: 'success' | 'reverted';
  gasUsed: bigint;
  logs: Array<{
    address: `0x${string}`;
    topics: `0x${string}`[];
    data: `0x${string}`;
  }>;
} 