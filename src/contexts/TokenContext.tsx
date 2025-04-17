import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { TokenManager } from '../core/token/TokenManager';
import { TokenBalance } from '../types/token';
import { EVMAdapter } from '../core/evm/EVMAdapter';
import { mainnet } from 'viem/chains';
import debounce from 'lodash/debounce';
import { Address } from 'viem';

interface TokenContextType {
  tokens: TokenBalance[];
  addToken: (token: TokenBalance) => void;
  removeToken: (address: Address) => void;
  updateToken: (token: TokenBalance) => void;
  getToken: (address: Address) => TokenBalance | undefined;
  balances: TokenBalance[];
  refreshBalances: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const STORAGE_KEY = 'tracked_tokens';

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useWallet();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const tokenManager = React.useMemo(() => new TokenManager(new EVMAdapter(mainnet)), []);
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
      setBalances(newBalances);
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

  // Refresh balances when address or tokens change
  useEffect(() => {
    if (address && isConnected) {
      debouncedRefresh();
    }
  }, [address, isConnected, debouncedRefresh]);

  const addToken = useCallback((token: TokenBalance) => {
    setTokens(prev => [...prev, token]);
  }, []);

  const removeToken = useCallback((address: Address) => {
    setTokens(prev => prev.filter(token => token.address !== address));
  }, []);

  const updateToken = useCallback((token: TokenBalance) => {
    setTokens(prev => prev.map(t => t.address === token.address ? token : t));
  }, []);

  const getToken = useCallback((address: Address) => {
    return tokens.find(token => token.address === address);
  }, [tokens]);

  return (
    <TokenContext.Provider
      value={{
        tokens,
        addToken,
        removeToken,
        updateToken,
        getToken,
        balances,
        refreshBalances,
        isLoading,
        error
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
}; 