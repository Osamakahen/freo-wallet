import React, { useEffect, useState } from 'react';
import { PriceTracker } from '../core/price/PriceTracker';
import { TokenBalance } from '../types/wallet';
import { formatCurrency, formatPercentage } from '../utils/format';

interface TokenDetails {
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface TokenPriceProps {
  token: TokenBalance;
  priceTracker: PriceTracker;
}

export const TokenPrice: React.FC<TokenPriceProps> = ({ token, priceTracker }) => {
  const [price, setPrice] = useState<number>(0);
  const [details, setDetails] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPriceData = async () => {
      try {
        setLoading(true);
        const [tokenPrice, tokenDetails] = await Promise.all([
          priceTracker.getTokenPrice(token.address),
          priceTracker.getTokenDetails(token.address)
        ]);
        setPrice(tokenPrice);
        setDetails(tokenDetails);
      } catch (err) {
        setError('Failed to load price data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [token.address, priceTracker]);

  if (loading) {
    return <div className="animate-pulse">Loading price data...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const tokenValue = (Number(token.balance) / Math.pow(10, token.decimals)) * price;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{token.symbol}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Balance: {Number(token.balance) / Math.pow(10, token.decimals)} {token.symbol}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{formatCurrency(price)}</p>
          <p className={`text-sm ${details?.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(details?.change24h || 0)} (24h)
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Value</p>
          <p className="font-medium">{formatCurrency(tokenValue)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Market Cap</p>
          <p className="font-medium">{formatCurrency(details?.marketCap || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">24h Volume</p>
          <p className="font-medium">{formatCurrency(details?.volume24h || 0)}</p>
        </div>
      </div>
    </div>
  );
}; 