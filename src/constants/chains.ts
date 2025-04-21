import { Chain } from 'viem/chains';

export const CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    nativeCurrency: { 
      name: 'Ether', 
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: {
      default: { 
        http: [process.env.NEXT_PUBLIC_INFURA_URL || ''] 
      }
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://etherscan.io'
      }
    }
  }
} as const;

export type ChainId = keyof typeof CHAINS;

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  valueUSD?: number;
  chain: ChainId;
} 