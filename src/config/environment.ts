interface NetworkConfig {
  rpcUrl: string
  chainId: number
  name: string
  symbol: string
  blockExplorer?: string
}

interface Config {
  networks: {
    mainnet: NetworkConfig
    polygon: NetworkConfig
    bsc: NetworkConfig
    arbitrum: NetworkConfig
    optimism: NetworkConfig
  }
  apiKeys: {
    etherscan?: string
    infura?: string
    alchemy?: string
  }
  security: {
    maxFailedAttempts: number
    lockoutDuration: number
    sessionTimeout: number
    requireBiometric: boolean
  }
}

export const config: Config = {
  networks: {
    mainnet: {
      rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      chainId: 1,
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      blockExplorer: 'https://etherscan.io',
    },
    polygon: {
      rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
      chainId: 137,
      name: 'Polygon Mainnet',
      symbol: 'MATIC',
      blockExplorer: 'https://polygonscan.com',
    },
    bsc: {
      rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
      chainId: 56,
      name: 'BNB Smart Chain',
      symbol: 'BNB',
      blockExplorer: 'https://bscscan.com',
    },
    arbitrum: {
      rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      name: 'Arbitrum One',
      symbol: 'ETH',
      blockExplorer: 'https://arbiscan.io',
    },
    optimism: {
      rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      chainId: 10,
      name: 'Optimism',
      symbol: 'ETH',
      blockExplorer: 'https://optimistic.etherscan.io',
    },
  },
  apiKeys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
    infura: process.env.INFURA_API_KEY,
    alchemy: process.env.ALCHEMY_API_KEY,
  },
  security: {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireBiometric: true,
  },
}

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_MAINNET_RPC_URL',
  'NEXT_PUBLIC_POLYGON_RPC_URL',
  'NEXT_PUBLIC_BSC_RPC_URL',
  'NEXT_PUBLIC_ARBITRUM_RPC_URL',
  'NEXT_PUBLIC_OPTIMISM_RPC_URL',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set. Using fallback RPC URL.`)
  }
}

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return Object.values(config.networks).find(
    (network) => network.chainId === chainId
  )
}

export function getBlockExplorerUrl(chainId: number, txHash: string): string {
  const network = getNetworkConfig(chainId)
  return network?.blockExplorer ? `${network.blockExplorer}/tx/${txHash}` : ''
} 