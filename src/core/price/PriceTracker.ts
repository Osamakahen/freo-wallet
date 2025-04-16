import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { TokenBalance } from '../../types/wallet';

interface PriceCache {
  price: number;
  timestamp: number;
}

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export class PriceTracker {
  private client;
  private priceCache: Map<string, PriceCache>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private COINGECKO_API = 'https://api.coingecko.com/api/v3';

  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http()
    });
    this.priceCache = new Map();
  }

  async getTokenPrice(tokenAddress: string): Promise<number> {
    const cached = this.priceCache.get(tokenAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      const response = await fetch(
        `${this.COINGECKO_API}/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
      );
      const data = await response.json();
      const price = data[tokenAddress.toLowerCase()]?.usd || 0;

      this.priceCache.set(tokenAddress, {
        price,
        timestamp: Date.now()
      });

      return price;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  async getTokenDetails(tokenAddress: string): Promise<TokenPrice> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API}/coins/ethereum/contract/${tokenAddress}`
      );
      const data = await response.json();
      
      return {
        symbol: data.symbol.toUpperCase(),
        price: data.market_data.current_price.usd,
        change24h: data.market_data.price_change_percentage_24h,
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd
      };
    } catch (error) {
      console.error('Error fetching token details:', error);
      return {
        symbol: '',
        price: 0,
        change24h: 0,
        marketCap: 0,
        volume24h: 0
      };
    }
  }

  async getPortfolioValue(tokens: TokenBalance[]): Promise<number> {
    let totalValue = 0;
    
    for (const token of tokens) {
      const price = await this.getTokenPrice(token.address);
      const balance = Number(token.balance) / Math.pow(10, token.decimals);
      totalValue += balance * price;
    }

    return totalValue;
  }

  clearCache(): void {
    this.priceCache.clear();
  }
} 