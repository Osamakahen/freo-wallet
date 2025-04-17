import React, { useState, useEffect } from 'react';
import { TokenManager } from '../../core/token/TokenManager';
import { TokenBalance } from '../../types/token';
import { useWallet } from '../../hooks/useWallet';
import { formatEther } from 'viem';

interface PortfolioProps {
  tokenManager: TokenManager;
}

interface ExtendedTokenBalance extends TokenBalance {
  name: string;
  symbol: string;
  price?: number;
}

const TokenImage: React.FC<{ symbol: string }> = ({ symbol }) => {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
      <span className="text-sm font-medium">{symbol[0]}</span>
    </div>
  );
};

export const Portfolio: React.FC<PortfolioProps> = ({ tokenManager }) => {
  const { state } = useWallet();
  const [balances, setBalances] = useState<ExtendedTokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<string>('0');

  useEffect(() => {
    const loadBalances = async () => {
      if (!state.address) return;

      try {
        setLoading(true);
        setError(null);

        // Load native token balance
        const nativeBalance = await tokenManager.getBalance('0x0000000000000000000000000000000000000000' as `0x${string}`, state.address as `0x${string}`);
        
        // Load ERC20 token balances
        const tokenAddresses = await tokenManager.getTokenList();
        const tokenBalances = await Promise.all(
          tokenAddresses.map(async (tokenAddress) => {
            const balance = await tokenManager.getTokenBalance(tokenAddress, state.address as `0x${string}`);
            const info = await tokenManager.getTokenInfo(tokenAddress);
            return {
              ...balance,
              ...info,
              price: 0 // In production, fetch from price feed
            };
          })
        );

        // Combine native and token balances
        const allBalances: ExtendedTokenBalance[] = [
          {
            tokenAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
            balance: formatEther(nativeBalance),
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
            price: 0 // In production, fetch from price feed
          },
          ...tokenBalances
        ];

        setBalances(allBalances);
        
        // Calculate total value
        const total = allBalances.reduce((sum, token) => {
          const price = parseFloat(token.balance) * (token.price || 0);
          return sum + price;
        }, 0);
        
        setTotalValue(total.toFixed(2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balances');
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [state.address, tokenManager]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <div className="text-2xl font-bold">${totalValue}</div>
      </div>
      
      <div className="space-y-4">
        {balances.map((token) => (
          <div key={token.tokenAddress} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <TokenImage symbol={token.symbol} />
              <div>
                <div className="font-medium">{token.symbol}</div>
                <div className="text-sm text-gray-500">{token.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{token.balance}</div>
              {token.price !== undefined && (
                <div className="text-sm text-gray-500">
                  ${(parseFloat(token.balance) * token.price).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 