'use client';

import React, { useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { type Address } from 'viem';
import useWalletStore from '../store/walletStore';
import { EthereumProvider } from '../types/ethereum';
import { TransactionRequest } from '../types/wallet';

type AccountsChangedHandler = (accounts: string[]) => void;
type ChainChangedHandler = (chainId: string) => void;
type DisconnectHandler = () => void;

interface WalletContextType {
  state: {
    address: `0x${string}` | null;
    isConnected: boolean;
    balance: string;
    chainId: number;
    network: string;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTransaction: (tx: TransactionRequest) => Promise<string>;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}

export function useWallet(): WalletContextType {
  const {
    address,
    isConnected,
    balance,
    chainId,
    network,
    isConnecting,
    error,
    setConnected,
    setAddress,
    setBalance,
    setChainId,
    setNetwork,
    setConnecting,
    setError
  } = useWalletStore();

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setBalance('0');
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  }, [setAddress, setConnected, setBalance, setError]);

  const handleAccountsChanged: AccountsChangedHandler = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0] as `0x${string}`);
    }
  }, [setAddress, disconnect]);

  const handleChainChanged: ChainChangedHandler = useCallback((chainId) => {
    setChainId(parseInt(chainId, 16));
  }, [setChainId]);

  const handleDisconnect: DisconnectHandler = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const sendTransaction = async (tx: TransactionRequest): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx]
      }) as string;

      return txHash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;

      const balance = (await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      })) as string;

      setAddress(accounts[0] as `0x${string}`);
      setChainId(parseInt(chainId, 16));
      setBalance(balance);
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  return {
    state: {
      address,
      isConnected,
      balance,
      chainId,
      network
    },
    connect,
    disconnect,
    sendTransaction,
    isConnecting,
    error
  };
}