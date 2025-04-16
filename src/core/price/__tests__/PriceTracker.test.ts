import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceTracker } from '../PriceTracker';
import { TokenBalance } from '../../../types/wallet';

describe('PriceTracker', () => {
  let priceTracker: PriceTracker;
  const mockTokenAddress = '0x123' as const;
  const mockTokenBalance: TokenBalance = {
    address: mockTokenAddress,
    symbol: 'TEST',
    balance: BigInt('1000000000000000000'),
    decimals: 18
  };

  beforeEach(() => {
    priceTracker = new PriceTracker();
    vi.clearAllMocks();
  });

  it('should get token price', async () => {
    const mockPrice = 100;
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        [mockTokenAddress.toLowerCase()]: { usd: mockPrice }
      })
    });

    const price = await priceTracker.getTokenPrice(mockTokenAddress);
    expect(price).toBe(mockPrice);
  });

  it('should cache token price', async () => {
    const mockPrice = 100;
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        [mockTokenAddress.toLowerCase()]: { usd: mockPrice }
      })
    });

    // First call should fetch from API
    await priceTracker.getTokenPrice(mockTokenAddress);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await priceTracker.getTokenPrice(mockTokenAddress);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should get token details', async () => {
    const mockDetails = {
      symbol: 'TEST',
      market_data: {
        current_price: { usd: 100 },
        price_change_percentage_24h: 5,
        market_cap: { usd: 1000000 },
        total_volume: { usd: 100000 }
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockDetails)
    });

    const details = await priceTracker.getTokenDetails(mockTokenAddress);
    expect(details).toEqual({
      symbol: 'TEST',
      price: 100,
      change24h: 5,
      marketCap: 1000000,
      volume24h: 100000
    });
  });

  it('should calculate portfolio value', async () => {
    const mockPrice = 100;
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        [mockTokenAddress.toLowerCase()]: { usd: mockPrice }
      })
    });

    const value = await priceTracker.getPortfolioValue([mockTokenBalance]);
    expect(value).toBe(100); // 1 token * $100
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    const price = await priceTracker.getTokenPrice(mockTokenAddress);
    expect(price).toBe(0);

    const details = await priceTracker.getTokenDetails(mockTokenAddress);
    expect(details).toEqual({
      symbol: '',
      price: 0,
      change24h: 0,
      marketCap: 0,
      volume24h: 0
    });
  });
}); 