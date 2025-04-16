import React, { useEffect, useState } from 'react';
import { PortfolioManager } from '../core/portfolio/PortfolioManager';
import { PriceTracker } from '../core/price/PriceTracker';
import { TokenPrice } from './TokenPrice';
import { formatCurrency } from '../utils/format';
import { Address } from 'viem';

interface PortfolioToken {
  address: string;
  symbol: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
  decimals: number;
}

interface PortfolioProps {
  address: Address;
  portfolioManager: PortfolioManager;
  priceTracker: PriceTracker;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  address,
  portfolioManager,
  priceTracker
}) => {
  const [tokens, setTokens] = useState<PortfolioToken[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        const summary = await portfolioManager.getPortfolioSummary(address);
        setTokens(summary.tokens.map(token => ({
          ...token,
          decimals: token.address === 'native' ? 18 : 18 // Default to 18 decimals for now
        })));
        setPortfolioValue(summary.totalValue);
      } catch (err) {
        setError('Failed to load portfolio');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [address, portfolioManager]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">Portfolio Value</h2>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          {formatCurrency(portfolioValue)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <TokenPrice
            key={token.address}
            token={token}
            priceTracker={priceTracker}
          />
        ))}
      </div>
    </div>
  );
}; 