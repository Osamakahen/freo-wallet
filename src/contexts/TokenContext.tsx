import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { TokenManager } from '../core/token/TokenManager';
import { TokenBalance } from '../types/token';
import { EVMAdapter } from '../core/network/EVMAdapter';
import { mainnet } from 'viem/chains';
import debounce from 'lodash/debounce';
import { Address } from 'viem';

interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  chainId: number;
}

interface TokenContextType {
  tokens: Token[];
  addToken: (token: Token) => void;
  removeToken: (address: Address) => void;
  updateToken: (token: Token) => void;
  getToken: (address: Address) => Token | undefined;
  balances: TokenBalance[];
  refreshBalances: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const STORAGE_KEY = 'tracked_tokens';

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const tokenManager = React.useMemo(() => new TokenManager(new EVMAdapter()), []);
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  // Load saved tokens on mount
  useEffect(() => {
    try {
      const savedTokens = localStorage.getItem(STORAGE_KEY);
      if (savedTokens) {
        setTokens(JSON.parse(savedTokens));
      }
    } catch (err) {
      console.error('Failed to load saved tokens:', err);
    }
  }, []);

  // Save tokens to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch (err) {
      console.error('Failed to save tokens:', err);
    }
  }, [tokens]);

  const refreshBalances = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newBalances = await Promise.all(
        tokens.map(async (token) => {
          const balance = await tokenManager.getTokenBalance(token.address, address as `0x${string}`);
          return {
            ...token,
            balance: balance.balance,
            decimals: balance.decimals
          };
        })
      );
      
      setTokens(newBalances);
      setBalances(newBalances.map(balance => ({
        tokenAddress: balance.address,
        balance: balance.balance,
        decimals: balance.decimals
      })));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh balances'));
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, tokenManager, tokens]);

  // Debounce refreshBalances to prevent too many calls
  const debouncedRefresh = useCallback(
    debounce(() => {
      refreshBalances();
    }, 1000),
    [refreshBalances, debounce]
  );

  useEffect(() => {
    if (address && isConnected) {
      debouncedRefresh();
    }
    return () => debouncedRefresh.cancel();
  }, [address, isConnected, debouncedRefresh]);

  const addToken = useCallback((token: Token) => {
    setTokens(prevTokens => [...prevTokens, token]);
  }, []);

  const removeToken = useCallback((address: Address) => {
    setTokens(prevTokens => prevTokens.filter(token => token.address !== address));
  }, []);

  const updateToken = useCallback((updatedToken: Token) => {
    setTokens(prevTokens => 
      prevTokens.map(token => 
        token.address === updatedToken.address ? updatedToken : token
      )
    );
  }, []);

  const getToken = useCallback((address: Address) => {
    return tokens.find(token => token.address === address);
  }, [tokens]);

  return (
    <TokenContext.Provider value={{
      tokens,
      addToken,
      removeToken,
      updateToken,
      getToken,
      balances,
      refreshBalances,
      isLoading,
      error
    }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}; 