import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDApp } from '../../contexts/DAppContext';
import { TokenManager } from '../../core/token/TokenManager';
import { TokenBalance, TokenInfo } from '../../types/token';
import { formatEther } from 'ethers';
import { useWallet } from '../../contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

interface PortfolioProps {
  tokenManager: TokenManager;
}

interface ExtendedTokenBalance extends TokenBalance {
  info?: TokenInfo;
  price?: number;
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

export const Portfolio = () => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState<ExtendedTokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet) return;

      try {
        setLoading(true);
        const tokenList = await wallet.getTokenList();
        const allBalances = await Promise.all(
          tokenList.map(async (tokenAddress) => {
            const balance = await wallet.getTokenBalance(tokenAddress, wallet.getState().address!);
            const info = await wallet.getTokenInfo(tokenAddress);
            return {
              ...balance,
              info,
              price: 0 // TODO: Fetch actual price from price feed
            };
          })
        );
        setBalances(allBalances);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [wallet]);

  if (loading) {
    return <div>Loading token balances...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No tokens found in your portfolio.</p>
          <Button>Send Tokens</Button>
        </CardContent>
      </Card>
    );
  }

  const totalValue = balances.reduce((sum, balance) => {
    const value = balance.price ? Number(balance.balance) * balance.price : 0;
    return sum + value;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
        <Badge variant="secondary">Total Value: ${totalValue.toFixed(2)}</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {balances.map((balance) => (
              <div key={balance.tokenAddress} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <TokenImage address={balance.tokenAddress} symbol={balance.info?.symbol || 'TOKEN'} />
                  <div>
                    <div className="font-medium">{balance.info?.symbol || 'TOKEN'}</div>
                    <div className="text-sm text-gray-500">{balance.info?.name || 'Unknown Token'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatEther(balance.balance)}</div>
                  {balance.price && (
                    <div className="text-sm text-gray-500">
                      ${(Number(balance.balance) * balance.price).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Button className="mt-4">Send Tokens</Button>
      </CardContent>
    </Card>
  );
}; 