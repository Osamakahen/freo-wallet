export enum ChainId {
  ETHEREUM = 1,
  POLYGON = 137,
  BSC = 56,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  AVALANCHE = 43114
}

export interface ChainConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export interface GasConfig {
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit?: string;
}

export interface TransactionConfig extends GasConfig {
  to: string;
  value?: string;
  data?: string;
  nonce?: number;
} 