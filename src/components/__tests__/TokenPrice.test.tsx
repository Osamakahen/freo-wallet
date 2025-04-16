import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TokenPrice } from '../TokenPrice';
import { PriceTracker } from '../../core/price/PriceTracker';
import { TokenBalance } from '../../types/wallet';

describe('TokenPrice', () => {
  const mockToken: TokenBalance = {
    address: '0x123' as const,
    symbol: 'TEST',
    balance: BigInt('1000000000000000000'),
    decimals: 18
  };

  const mockPriceTracker = {
    getTokenPrice: vi.fn(),
    getTokenDetails: vi.fn()
  } as unknown as PriceTracker;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    render(<TokenPrice token={mockToken} priceTracker={mockPriceTracker} />);
    expect(screen.getByText('Loading price data...')).toBeInTheDocument();
  });

  it('should display token price and details', async () => {
    const mockPrice = 100;
    const mockDetails = {
      change24h: 5,
      marketCap: 1000000,
      volume24h: 100000
    };

    vi.mocked(mockPriceTracker.getTokenPrice).mockResolvedValue(mockPrice);
    vi.mocked(mockPriceTracker.getTokenDetails).mockResolvedValue(mockDetails);

    render(<TokenPrice token={mockToken} priceTracker={mockPriceTracker} />);

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('+5.00% (24h)')).toBeInTheDocument();
      expect(screen.getByText('Balance: 1 TEST')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument(); // Token value
      expect(screen.getByText('$1,000,000.00')).toBeInTheDocument(); // Market cap
      expect(screen.getByText('$100,000.00')).toBeInTheDocument(); // 24h volume
    });
  });

  it('should display error state', async () => {
    vi.mocked(mockPriceTracker.getTokenPrice).mockRejectedValue(new Error('API Error'));
    vi.mocked(mockPriceTracker.getTokenDetails).mockRejectedValue(new Error('API Error'));

    render(<TokenPrice token={mockToken} priceTracker={mockPriceTracker} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load price data')).toBeInTheDocument();
    });
  });

  it('should handle negative price change', async () => {
    const mockPrice = 100;
    const mockDetails = {
      change24h: -5,
      marketCap: 1000000,
      volume24h: 100000
    };

    vi.mocked(mockPriceTracker.getTokenPrice).mockResolvedValue(mockPrice);
    vi.mocked(mockPriceTracker.getTokenDetails).mockResolvedValue(mockDetails);

    render(<TokenPrice token={mockToken} priceTracker={mockPriceTracker} />);

    await waitFor(() => {
      const changeElement = screen.getByText('-5.00% (24h)');
      expect(changeElement).toHaveClass('text-red-500');
    });
  });
}); 