import { describe, it, expect, beforeEach } from 'vitest';
import { TokenManager } from '../TokenManager';
import { createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';

// Mock viem functions
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  getContract: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

// Mock fetch
global.fetch = jest.fn();

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address;
  const mockTokenAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address; // WBTC on mainnet

  beforeEach(() => {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });

    tokenManager = new TokenManager(publicClient);
  });

  describe('getTokenInfo', () => {
    it('should fetch token information', async () => {
      const info = await tokenManager.getTokenInfo(mockTokenAddress);

      expect(info).toBeDefined();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('symbol');
      expect(info).toHaveProperty('decimals');
      expect(typeof info.name).toBe('string');
      expect(typeof info.symbol).toBe('string');
      expect(typeof info.decimals).toBe('number');
    });

    it('should handle invalid token address', async () => {
      const invalidAddress = '0xinvalid' as Address;
      
      await expect(
        tokenManager.getTokenInfo(invalidAddress)
      ).rejects.toThrow();
    });
  });

  describe('getTokenBalance', () => {
    it('should fetch token balance for an address', async () => {
      const balance = await tokenManager.getTokenBalance(mockTokenAddress, mockAddress);

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('bigint');
      expect(balance).toBeGreaterThanOrEqual(BigInt(0));
    });

    it('should handle zero balance', async () => {
      const zeroBalanceAddress = '0x0000000000000000000000000000000000000000' as Address;
      const balance = await tokenManager.getTokenBalance(mockTokenAddress, zeroBalanceAddress);

      expect(balance).toBe(BigInt(0));
    });
  });

  describe('getTokenAllowance', () => {
    it('should fetch token allowance', async () => {
      const spender = '0x1111111111111111111111111111111111111111' as Address;
      const allowance = await tokenManager.getTokenAllowance(mockTokenAddress, mockAddress, spender);

      expect(allowance).toBeDefined();
      expect(typeof allowance).toBe('bigint');
      expect(allowance).toBeGreaterThanOrEqual(BigInt(0));
    });
  });

  describe('approve', () => {
    it('should create approval transaction', async () => {
      const spender = '0x1111111111111111111111111111111111111111' as Address;
      const amount = BigInt(100000000); // 0.1 WBTC (8 decimals)

      const tx = await tokenManager.approve(mockTokenAddress, spender, amount);

      expect(tx).toBeDefined();
      expect(tx).toHaveProperty('to');
      expect(tx).toHaveProperty('data');
      expect(tx.to).toBe(mockTokenAddress);
    });

    it('should handle infinite approval', async () => {
      const spender = '0x1111111111111111111111111111111111111111' as Address;
      const tx = await tokenManager.approve(mockTokenAddress, spender);

      expect(tx).toBeDefined();
      expect(tx).toHaveProperty('to');
      expect(tx).toHaveProperty('data');
      expect(tx.to).toBe(mockTokenAddress);
    });
  });

  describe('transfer', () => {
    it('should create transfer transaction', async () => {
      const recipient = '0x2222222222222222222222222222222222222222' as Address;
      const amount = BigInt(100000000); // 0.1 WBTC (8 decimals)

      const tx = await tokenManager.transfer(mockTokenAddress, recipient, amount);

      expect(tx).toBeDefined();
      expect(tx).toHaveProperty('to');
      expect(tx).toHaveProperty('data');
      expect(tx.to).toBe(mockTokenAddress);
    });
  });

  describe('getTokenMetadata', () => {
    it('should return token metadata', async () => {
      const mockContract = {
        read: {
          name: jest.fn().mockResolvedValue('Test Token'),
          symbol: jest.fn().mockResolvedValue('TEST'),
          decimals: jest.fn().mockResolvedValue(18)
        }
      };

      (getContract as jest.Mock).mockReturnValue(mockContract);

      const metadata = await tokenManager.getTokenMetadata(mockTokenAddress as `0x${string}`);

      expect(metadata).toEqual({
        address: mockTokenAddress,
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18
      });
    });
  });

  describe('getTokenBalance', () => {
    it('should return token balance with USD value', async () => {
      const mockContract = {
        read: {
          balanceOf: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
          name: jest.fn().mockResolvedValue('Test Token'),
          symbol: jest.fn().mockResolvedValue('TEST'),
          decimals: jest.fn().mockResolvedValue(18)
        }
      };

      (getContract as jest.Mock).mockReturnValue(mockContract);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          [mockTokenAddress.toLowerCase()]: { usd: 1.5 }
        })
      });

      const balance = await tokenManager.getTokenBalance(
        mockTokenAddress as `0x${string}`,
        mockAddress as `0x${string}`
      );

      expect(balance).toEqual({
        token: {
          address: mockTokenAddress,
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 18
        },
        balance: '1000000000000000000',
        balanceUSD: '1.5'
      });
    });
  });

  describe('getAllowance', () => {
    it('should return allowance amount', async () => {
      const mockContract = {
        read: {
          allowance: jest.fn().mockResolvedValue(BigInt('500000000000000000'))
        }
      };

      (getContract as jest.Mock).mockReturnValue(mockContract);

      const allowance = await tokenManager.getAllowance(
        mockTokenAddress as `0x${string}`,
        mockAddress as `0x${string}`,
        mockTokenAddress as `0x${string}`
      );

      expect(allowance).toBe(BigInt('500000000000000000'));
    });
  });

  describe('getTokenPrice', () => {
    it('should return token price from cache if available', async () => {
      const mockPrice = 1.5;
      const mockTimestamp = Date.now();
      (tokenManager as any).priceCache.set(mockTokenAddress, {
        price: mockPrice,
        timestamp: mockTimestamp
      });

      const price = await tokenManager.getTokenPrice(mockTokenAddress as `0x${string}`);
      expect(price).toBe(mockPrice);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache new price if cache is expired', async () => {
      const mockPrice = 1.5;
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      (tokenManager as any).priceCache.set(mockTokenAddress, {
        price: 1.0,
        timestamp: oldTimestamp
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({
          [mockTokenAddress.toLowerCase()]: { usd: mockPrice }
        })
      });

      const price = await tokenManager.getTokenPrice(mockTokenAddress as `0x${string}`);
      expect(price).toBe(mockPrice);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return null if price fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const price = await tokenManager.getTokenPrice(mockTokenAddress as `0x${string}`);
      expect(price).toBeNull();
    });
  });
}); 