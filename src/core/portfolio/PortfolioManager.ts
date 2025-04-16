import { TokenManager } from '../token/TokenManager';
import { TokenBalance } from '../../types/wallet';
import { formatEther } from 'viem';
import { Address } from 'viem';

export interface PortfolioSummary {
  totalValue: number;
  tokens: {
    address: string;
    symbol: string;
    balance: string;
    price: number;
    value: number;
    change24h: number;
  }[];
}

export class PortfolioManager {
  private tokenManager: TokenManager;
  private priceCache: Map<string, { price: number; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
    this.priceCache = new Map();
  }

  async getPortfolioSummary(address: Address): Promise<PortfolioSummary> {
    try {
      // Get token balances
      const balances = await this.tokenManager.getTokenBalances(address);
      
      // Get native token balance
      const nativeBalance = await this.tokenManager.getBalance(address);
      
      // Get token prices
      const tokenPrices = await Promise.all(
        balances.map(async (token: TokenBalance) => {
          const price = await this.getTokenPrice(token.address);
          return {
            address: token.address,
            price,
          };
        })
      );

      // Calculate portfolio value
      const tokenValues = balances.map((token: TokenBalance) => {
        const price = tokenPrices.find((p: { address: string; price: number }) => p.address === token.address)?.price || 0;
        const value = Number(formatEther(token.balance)) * price;
        return {
          address: token.address,
          symbol: token.symbol,
          balance: formatEther(token.balance),
          price,
          value,
          change24h: 0, // TODO: Implement 24h price change
        };
      });

      // Add native token value
      const nativeTokenValue = {
        address: 'native',
        symbol: 'ETH',
        balance: formatEther(nativeBalance),
        price: await this.getTokenPrice('native'),
        value: Number(formatEther(nativeBalance)) * (await this.getTokenPrice('native')),
        change24h: 0,
      };

      const totalValue = [...tokenValues, nativeTokenValue].reduce(
        (sum, token) => sum + token.value,
        0
      );

      return {
        totalValue,
        tokens: [...tokenValues, nativeTokenValue],
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw new Error('Failed to get portfolio summary');
    }
  }

  private async getTokenPrice(tokenAddress: string): Promise<number> {
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      let price: number;
      if (tokenAddress === 'native') {
        // Get ETH price from CoinGecko
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await response.json();
        price = data.ethereum.usd;
      } else {
        // Get token price from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
        );
        const data = await response.json();
        price = data[tokenAddress.toLowerCase()].usd;
      }

      this.priceCache.set(tokenAddress, {
        price,
        timestamp: Date.now(),
      });

      return price;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  clearPriceCache(): void {
    this.priceCache.clear();
  }
} 