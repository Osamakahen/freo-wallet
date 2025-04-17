import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDApp } from '../../contexts/DAppContext';
import { TokenManager } from '../../core/token/TokenManager';
import { TokenBalance } from '../../types/token';
import { formatEther } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TokenBalance as NewTokenBalance, TokenManager as NewTokenManager } from '@/lib/tokens';

interface PortfolioProps {
  tokenManager: TokenManager;
}

interface TokenData extends TokenBalance {
  address: `0x${string}`;
  symbol: string;
  name: string;
  price?: string;
}

const TokenImage: React.FC<{ address: string; symbol: string }> = ({ address, symbol }) => {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-sm font-medium">{symbol[0]}</span>
    </div>
  );
};

export const Portfolio: React.FC<PortfolioProps> = ({ tokenManager }) => {
  const { address } = useWallet();
  const [balances, setBalances] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<string>('0');

  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;

      try {
        setLoading(true);
        const tokenList = await tokenManager.getTokenList();
        const allBalances = await Promise.all(
          tokenList.map(async (tokenAddress) => {
            const balance = await tokenManager.getTokenBalance(tokenAddress as `0x${string}`, address);
            const info = await tokenManager.getTokenInfo(tokenAddress as `0x${string}`);
            return {
              ...balance,
              address: tokenAddress as `0x${string}`,
              symbol: info.symbol,
              name: info.name,
              price: '0' // TODO: Fetch actual price from price feed
            } as TokenData;
          })
        );
        setBalances(allBalances);

        // Calculate total value
        const total = allBalances.reduce((sum, token) => {
          const value = parseFloat(formatEther(token.balance)) * parseFloat(token.price || '0');
          return sum + value;
        }, 0);

        setTotalValue(total.toFixed(2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address, tokenManager]);

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Portfolio</h2>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold">${totalValue}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : balances.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-gray-500">No tokens found in your wallet</p>
            <Button className="mt-4">Send Tokens</Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-4">Token</th>
                  <th className="pb-4">Balance</th>
                  <th className="pb-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((token) => (
                  <tr key={token.address} className="border-t border-gray-100">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <TokenImage address={token.address} symbol={token.symbol} />
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-sm text-gray-500">{token.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {parseFloat(formatEther(token.balance)).toFixed(4)}
                    </td>
                    <td className="py-4 text-right">
                      ${(parseFloat(formatEther(token.balance)) * parseFloat(token.price || '0')).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}; 