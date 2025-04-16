export interface CategorizedTransaction {
  hash: `0x${string}`;
  category: 'send' | 'receive' | 'approval';
  from: `0x${string}`;
  to: `0x${string}`;
  amount: number;
  tokenSymbol: string;
  tokenAddress: `0x${string}`;
  status: 'success' | 'reverted';
  blockNumber: number;
  gasUsed: string;
  effectiveGasPrice: string;
}

export interface TransactionFilter {
  startBlock?: number;
  endBlock?: number;
  category?: 'send' | 'receive' | 'approval';
  tokenAddress?: `0x${string}`;
  limit?: number;
} 