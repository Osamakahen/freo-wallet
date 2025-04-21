export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  blockExplorer?: string;
  explorer?: string;
  iconUrl?: string;
}

export const NETWORKS: NetworkConfig[] = [
  {
    name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'Ethereum Mainnet',
    chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 1,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/',
    symbol: process.env.NEXT_PUBLIC_SYMBOL || 'ETH',
    explorer: process.env.NEXT_PUBLIC_EXPLORER || 'https://etherscan.io'
  },
  {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    symbol: 'MATIC',
    blockExplorer: process.env.NEXT_PUBLIC_POLYGONSCAN_URL || 'https://polygonscan.com',
    iconUrl: '/images/polygon-logo.svg'
  },
  {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    blockExplorer: process.env.NEXT_PUBLIC_BSCSCAN_URL || 'https://bscscan.com',
    iconUrl: '/images/bnb-logo.svg'
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    blockExplorer: process.env.NEXT_PUBLIC_ARBISCAN_URL || 'https://arbiscan.io',
    iconUrl: '/images/arbitrum-logo.svg'
  },
  {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    symbol: 'ETH',
    blockExplorer: process.env.NEXT_PUBLIC_OPTIMISMSCAN_URL || 'https://optimistic.etherscan.io',
    iconUrl: '/images/optimism-logo.svg'
  }
]; 