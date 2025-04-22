'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletManager } from '../core/wallet/WalletManager';
import { toast } from 'react-toastify';
import { EthereumEvent, EthereumCallback, EthereumProvider } from '../types/ethereum';
import { WalletError } from '../core/error/WalletError';

interface WalletContextType {
  walletManager: WalletManager;
  ethereum: EthereumProvider | undefined;
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  loading: boolean;
  error: string | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  setChainId: (chainId: string | number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode; devMode?: boolean }> = ({ children, devMode = false }) => {
  const [ethereum, setEthereum] = useState<EthereumProvider | undefined>(undefined);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [walletManager] = useState(() => new WalletManager(devMode));

  // Auto-connect in dev mode
  useEffect(() => {
    if (devMode) {
      connect();
    }
  }, [devMode]);

  useEffect(() => {
    // Only access window.ethereum on the client side and in production mode
    if (!devMode && typeof window !== 'undefined' && window.ethereum) {
      setEthereum(window.ethereum as EthereumProvider);
    }
  }, [devMode]);

  useEffect(() => {
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAddress(accounts[0] as string);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      setChainId(newChainId as string);
    };

    const handleDisconnect = () => {
      setAddress(null);
      setIsConnected(false);
      setChainId(null);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('disconnect', handleDisconnect);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
      ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [ethereum]);

  const connect = async () => {
    try {
      setLoading(true);
      setError(null);
      await walletManager.connect();
      const address = await walletManager.getAddress();
      setAddress(address);
      setIsConnected(true);
      
      // Get initial balance
      const state = walletManager.getState();
      setBalance(state.balance);
      
      toast.success('Connected successfully!');
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    try {
      walletManager.disconnect();
      setAddress(null);
      setIsConnected(false);
      setChainId(null);
      setBalance('0');
      toast.info('Disconnected from wallet');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleSetChainId = async (newChainId: string | number) => {
    try {
      setChainId(newChainId.toString());
      // Additional chain switching logic if needed
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch chain');
      toast.error('Failed to switch chain');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletManager,
        ethereum,
        address,
        chainId,
        isConnected,
        isConnecting: loading,
        loading,
        error,
        balance,
        connect,
        disconnect,
        setChainId: handleSetChainId
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 