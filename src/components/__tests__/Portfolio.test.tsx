import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Portfolio } from '../Portfolio';
import { PortfolioManager } from '../../core/portfolio/PortfolioManager';
import { PriceTracker } from '../../core/price/PriceTracker';
import { TokenBalance } from '../../types/wallet';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Portfolio', () => {
  const mockAddress = '0x123' as const;
  const mockTokens: TokenBalance[] = [
    {
      address: '0x456' as const,
      symbol: 'TEST1',
      balance: BigInt('1000000000000000000'),
      decimals: 18
    },
    {
      address: '0x789' as const,
      symbol: 'TEST2',
      balance: BigInt('2000000000000000000'),
      decimals: 18
    }
  ];

  const mockPortfolioManager = {
    getTokenBalances: vi.fn()
  } as unknown as PortfolioManager;

  const mockPriceTracker = {
    getPortfolioValue: vi.fn()
  } as unknown as PriceTracker;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    render(
      <Portfolio
        address={mockAddress}
        portfolioManager={mockPortfolioManager}
        priceTracker={mockPriceTracker}
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display portfolio value and tokens', async () => {
    const mockPortfolioValue = 300;
    vi.mocked(mockPortfolioManager.getTokenBalances).mockResolvedValue(mockTokens);
    vi.mocked(mockPriceTracker.getPortfolioValue).mockResolvedValue(mockPortfolioValue);

    render(
      <Portfolio
        address={mockAddress}
        portfolioManager={mockPortfolioManager}
        priceTracker={mockPriceTracker}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('$300.00')).toBeInTheDocument();
      expect(screen.getByText('TEST1')).toBeInTheDocument();
      expect(screen.getByText('TEST2')).toBeInTheDocument();
    });
  });

  it('should display error state', async () => {
    vi.mocked(mockPortfolioManager.getTokenBalances).mockRejectedValue(new Error('API Error'));

    render(
      <Portfolio
        address={mockAddress}
        portfolioManager={mockPortfolioManager}
        priceTracker={mockPriceTracker}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load portfolio')).toBeInTheDocument();
    });
  });

  it('should handle empty portfolio', async () => {
    vi.mocked(mockPortfolioManager.getTokenBalances).mockResolvedValue([]);
    vi.mocked(mockPriceTracker.getPortfolioValue).mockResolvedValue(0);

    render(
      <Portfolio
        address={mockAddress}
        portfolioManager={mockPortfolioManager}
        priceTracker={mockPriceTracker}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });
}); 