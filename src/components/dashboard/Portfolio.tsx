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

interface TokenData extends TokenBalance {
  symbol: string;
  name: string;
  price: string;
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
  const { address, balance } = useWallet();
  const [balances, setBalances] = useState<TokenData[]>([]);
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
        const nativeBalance = await tokenManager.getBalance(currentAccount, currentChain);
        
        // Load ERC20 token balances
        const tokenBalances = await tokenManager.getTokenBalance(currentAccount, currentChain);
        
        // Combine and sort balances
        const allBalances: TokenData[] = [
          {
            balance: nativeBalance,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
            price: '2000' // Mock price
          },
          ...tokenBalances.map(balance => ({
            ...balance,
            symbol: 'TOKEN', // Replace with actual symbol
            name: 'Token', // Replace with actual name
            price: '1' // Mock price
          }))
        ].sort((a, b) => {
          const valueA = parseFloat(formatEther(a.balance)) * parseFloat(a.price);
          const valueB = parseFloat(formatEther(b.balance)) * parseFloat(b.price);
          return valueB - valueA;
        });

        setBalances(allBalances);

        // Calculate total value
        const total = allBalances.reduce((sum, token) => {
          const value = parseFloat(formatEther(token.balance)) * parseFloat(token.price);
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
    if (address) {
      // Mock tokens for now - replace with actual token fetching
      setBalances([
        {
          balance: balance || '0',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
          price: '2000'
        }
      ]);
    }
  }, [address, balance]);

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
            {balances.map((token, index) => (
              <Card key={index} className="p-4">
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