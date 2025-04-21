export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
}

export interface TokenBalance {
  tokenAddress: `0x${string}`;
  balance: string;
  decimals: number;
}

export interface TokenPrice {
  tokenAddress: `0x${string}`;
  price: number;
  timestamp: number;
}

export interface TokenApproval {
  tokenAddress: `0x${string}`;
  spender: `0x${string}`;
  amount: string;
  allowance: string;
}

export interface ApprovalTransaction {
  type: 'approve' | 'revoke';
  amount: bigint;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  hash: `0x${string}`;
}

export interface TokenMetadata {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
} 