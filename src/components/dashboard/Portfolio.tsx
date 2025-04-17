import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDApp } from '../../contexts/DAppContext';
import { TokenManager } from '../../core/token/TokenManager';
import { TokenBalance } from '../../types/token';
import { formatEther } from 'ethers/lib/utils';

interface PortfolioProps {
  tokenManager: TokenManager;
}

const TokenImage: React.FC<{ address: string; symbol: string }> = ({ address, symbol }) => {
  const [imgSrc, setImgSrc] = useState(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`);

  return (
    <div className="flex-shrink-0 h-10 w-10 relative">
      <Image
        className="rounded-full"
        src={imgSrc}
        alt={symbol}
        width={40}
        height={40}
        onError={() => setImgSrc('/default-token.png')}
      />
    </div>
  );
};

export const Portfolio: React.FC<PortfolioProps> = ({ tokenManager }) => {
  const { currentAccount, currentChain } = useDApp();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<string>('0');

  useEffect(() => {
    const loadBalances = async () => {
      if (!currentAccount) return;

      try {
        setLoading(true);
        setError(null);

        // Load native token balance
        const nativeBalance = await tokenManager.getBalance('0x0000000000000000000000000000000000000000', currentAccount);
        
        // Load ERC20 token balances
        const tokenAddresses = await tokenManager.getTokenList();
        const tokenBalances = await Promise.all(
          tokenAddresses.map(async (tokenAddress) => {
            const balance = await tokenManager.getTokenBalance(tokenAddress, currentAccount);
            const info = await tokenManager.getTokenInfo(tokenAddress);
            return {
              ...info,
              balance: balance.balance,
              price: '0', // In production, fetch from price feed
            };
          })
        );
        
        // Combine and sort balances
        const allBalances = [
          {
            address: 'native',
            symbol: 'ETH',
            balance: formatEther(nativeBalance),
            decimals: 18,
            price: '0', // In production, fetch from price feed
          },
          ...tokenBalances,
        ].sort((a, b) => {
          const valueA = parseFloat(formatEther(a.balance)) * parseFloat(a.price || '0');
          const valueB = parseFloat(formatEther(b.balance)) * parseFloat(b.price || '0');
          return valueB - valueA;
        });

        setBalances(allBalances);

        // Calculate total value
        const total = allBalances.reduce((sum, token) => {
          const value = parseFloat(formatEther(token.balance)) * parseFloat(token.price || '0');
          return sum + value;
        }, 0);

        setTotalValue(total.toFixed(2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balances');
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [currentAccount, currentChain, tokenManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Portfolio Value</h2>
        <p className="text-3xl font-bold">${totalValue}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {balances.map((token) => (
              <tr key={token.address} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TokenImage address={token.address} symbol={token.symbol} />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{token.symbol}</div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatEther(token.balance)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${(parseFloat(formatEther(token.balance)) * parseFloat(token.price || '0')).toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 