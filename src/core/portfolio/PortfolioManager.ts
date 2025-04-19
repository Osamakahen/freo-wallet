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
      // Get token list
      const tokenList = await this.tokenManager.getTokenList();
      
      // Get token balances with prices
      const tokenBalances = await this.tokenManager.getTokenBalancesWithPrices(tokenList, address);
      
      // Get token info for each token
      const tokenInfos = await Promise.all(
        tokenList.map(tokenAddress => this.tokenManager.getTokenInfo(tokenAddress))
      );
      
      // Get native token balance
      const nativeBalance = await this.tokenManager.getBalance('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', address);
      
      // Calculate portfolio value
      const tokenValues = tokenBalances.map((token) => {
        const tokenInfo = tokenInfos.find(info => info.address === token.tokenAddress);
        return {
          address: token.tokenAddress,
          symbol: tokenInfo?.symbol || 'UNKNOWN',
          balance: token.balance,
          price: token.price,
          value: token.value,
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