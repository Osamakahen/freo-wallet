import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDApp } from '../../contexts/DAppContext';
import { TokenManager } from '../../core/token/TokenManager';
import { TokenBalance } from '../../types/token';
import { formatEther } from 'ethers';
import { useWallet } from "@/contexts/WalletContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { state } = useWallet();
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
        const nativeBalance = await tokenManager.getBalance(currentAccount);
        
        // Load ERC20 token balances
        const tokenBalances = await tokenManager.getTokenBalances(currentAccount);
        
        // Combine and sort balances
        const allBalances = [
          {
            address: 'native',
            symbol: 'ETH',
            balance: nativeBalance,
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

  useEffect(() => {
    if (state.address) {
      // Mock tokens for now - replace with actual token fetching
      setBalances([
        {
          address: '0x0000000000000000000000000000000000000000',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          balance: state.balance || '0',
          price: '2000'
        }
      ]);
    }
  }, [state]);

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
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
      <ScrollArea className="h-[300px]">
        {balances.length === 0 ? (
          <p className="text-gray-500">No tokens found</p>
        ) : (
          <div className="space-y-4">
            {balances.map((token) => (
              <Card key={token.address} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{token.symbol}</h3>
                      <Badge variant="secondary">{token.name}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Balance: {formatEther(token.balance)} {token.symbol}
                    </p>
                    <p className="text-sm text-gray-500">
                      Value: ${(Number(formatEther(token.balance)) * Number(token.price)).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    className="h-8 rounded-md px-3 text-xs"
                    onClick={() => {/* TODO: Implement send token */}}
                  >
                    Send
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}; 