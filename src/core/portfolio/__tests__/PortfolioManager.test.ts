import { PortfolioManager } from '../PortfolioManager';
import { TokenManager } from '../../token/TokenManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('PortfolioManager', () => {
  let portfolioManager: PortfolioManager;
  let mockTokenManager: TokenManager;

  beforeEach(() => {
    mockTokenManager = {
      getTokenBalance: vi.fn(),
      getBalance: vi.fn(),
    } as unknown as TokenManager;

    portfolioManager = new PortfolioManager(mockTokenManager);

    // Mock fetch
    global.fetch = vi.fn();
  });

  it('should get portfolio summary', async () => {
    const mockAddress = '0x123';
    const mockTokenBalances = [
      {
        address: '0x456',
        symbol: 'USDT',
        balance: BigInt('1000000000000000000'), // 1 USDT
      },
    ];
    const mockNativeBalance = BigInt('1000000000000000000'); // 1 ETH

    // Mock token manager methods
    (mockTokenManager.getTokenBalance as any).mockResolvedValue(mockTokenBalances[0]);
    (mockTokenManager.getBalance as any).mockResolvedValue(mockNativeBalance);

    // Mock fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('ethereum')) {
        return Promise.resolve({
          json: () => Promise.resolve({ ethereum: { usd: 2000 } }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ '0x456': { usd: 1 } }),
      });
    });

    const summary = await portfolioManager.getPortfolioSummary(mockAddress);

    expect(summary.totalValue).toBe(2001); // 1 ETH * $2000 + 1 USDT * $1
    expect(summary.tokens).toHaveLength(2);
    expect(summary.tokens[0]).toEqual({
      address: '0x456',
      symbol: 'USDT',
      balance: '1',
      price: 1,
      value: 1,
      change24h: 0,
    });
    expect(summary.tokens[1]).toEqual({
      address: 'native',
      symbol: 'ETH',
      balance: '1',
      price: 2000,
      value: 2000,
      change24h: 0,
    });
  });

  it('should handle errors when fetching prices', async () => {
    const mockAddress = '0x123';
    const mockTokenBalances = [
      {
        address: '0x456',
        symbol: 'USDT',
        balance: BigInt('1000000000000000000'),
      },
    ];

    // Mock token manager methods
    (mockTokenManager.getTokenBalance as any).mockResolvedValue(mockTokenBalances[0]);
    (mockTokenManager.getBalance as any).mockResolvedValue(BigInt('1000000000000000000'));

    // Mock fetch to throw error
    (global.fetch as any).mockRejectedValue(new Error('API error'));

    const summary = await portfolioManager.getPortfolioSummary(mockAddress);

    expect(summary.totalValue).toBe(0);
    expect(summary.tokens[0].price).toBe(0);
    expect(summary.tokens[0].value).toBe(0);
  });

  it('should use price cache', async () => {
    const mockAddress = '0x123';
    const mockTokenBalances = [
      {
        address: '0x456',
        symbol: 'USDT',
        balance: BigInt('1000000000000000000'),
      },
    ];

    // Mock token manager methods
    (mockTokenManager.getTokenBalance as any).mockResolvedValue(mockTokenBalances[0]);
    (mockTokenManager.getBalance as any).mockResolvedValue(BigInt('1000000000000000000'));

    // Mock fetch only once
    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ '0x456': { usd: 1 } }),
    });

    // Get summary twice
    await portfolioManager.getPortfolioSummary(mockAddress);
    await portfolioManager.getPortfolioSummary(mockAddress);

    // Fetch should only be called once due to caching
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
}); 