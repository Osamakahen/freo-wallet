/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    NEXT_PUBLIC_POLYGON_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL,
    NEXT_PUBLIC_ARBITRUM_RPC_URL: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    NEXT_PUBLIC_OPTIMISM_RPC_URL: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
    };
    return config;
  },
}

module.exports = nextConfig 