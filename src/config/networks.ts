/**
 * Network configuration for FreoWallet
 * This defines the supported blockchain networks
 */

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  chainColor: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAINS: Record<string, NetworkConfig> = {
  // Ethereum Mainnet
  '1': {
    chainId: '1',
    chainName: 'Ethereum Mainnet',
    chainColor: '#627EEA',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  
  // Polygon (Matic)
  '137': {
    chainId: '137',
    chainName: 'Polygon Mainnet',
    chainColor: '#8247E5',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  
  // Binance Smart Chain
  '56': {
    chainId: '56',
    chainName: 'BNB Smart Chain',
    chainColor: '#F0B90B',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  
  // Arbitrum
  '42161': {
    chainId: '42161',
    chainName: 'Arbitrum One',
    chainColor: '#28A0F0',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  
  // Optimism
  '10': {
    chainId: '10',
    chainName: 'Optimism',
    chainColor: '#FF0420',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io']
  },
  
  // Base
  '0x2105': {
    chainId: '0x2105',
    chainName: 'Base',
    chainColor: '#0052FF',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
  },
  
  // Ethereum Sepolia Testnet
  '0xaa36a7': {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    chainColor: '#627EEA',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

/**
 * Helper function to get network details by chain ID
 * @param chainId - The chain ID to look up
 * @returns Network configuration or null if not found
 */
export function getNetworkDetails(chainId: string): NetworkConfig | undefined {
  return CHAINS[chainId];
}

// Default chain to use when no preference is set
export const DEFAULT_CHAIN_ID = '1'; 