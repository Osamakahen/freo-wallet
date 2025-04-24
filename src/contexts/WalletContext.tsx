'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CHAINS, getNetworkDetails } from '../config/networks';
import { SessionService } from '../services/SessionService';
import { ethers } from 'ethers';

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  disconnect?: () => Promise<void>;
}

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  account: string | null;
  balance: string | null;
  chainId: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: string) => Promise<void>;
}

// Create context with proper type
const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Provider component
export function WalletProvider({ children }: WalletProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle account changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setAccount(null);
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
      
      // Update session for current origin if connected
      if (account) {
        const origin = window.location.origin;
        SessionService.getInstance().updateNetwork(origin, newChainId);
      }
    };

    const handleDisconnect = (error?: { message: string }) => {
      setAccount(null);
      setChainId(null);
      if (error) {
        setError(error.message);
      }
      
      // Remove session for current origin
      const origin = window.location.origin;
      SessionService.getInstance().removeSession(origin);
    };

    // Subscribe to events
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('disconnect', handleDisconnect);

    // Check initial connection state
    ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          
          // Also get chain ID
          return ethereum.request({ method: 'eth_chainId' });
        }
      })
      .then((chainId: string) => {
        if (chainId) {
          setChainId(chainId);
        }
      })
      .catch(console.error);

    // Cleanup
    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Connect wallet
  const connect = async (): Promise<void> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No wallet found');
    }

    setConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];
      
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }
      
      setAccount(accounts[0]);
      
      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      }) as string;
      
      setChainId(chainId);
      
      // Create or update session
      const origin = window.location.origin;
      await SessionService.getInstance().createSession(
        origin,
        accounts[0],
        chainId,
        { eth_accounts: true, eth_chainId: true }
      );
      
      setConnected(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async (): Promise<void> => {
    try {
      const ethereum = (window as any).ethereum;
      if (ethereum?.disconnect) {
        await ethereum.disconnect();
      }
      
      // Even if the provider doesn't support disconnect, we can still clear our state
      setAccount(null);
      setChainId(null);
      
      // Remove session for current origin
      const origin = window.location.origin;
      await SessionService.getInstance().removeSession(origin);
      
      setConnected(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to disconnect wallet');
      throw err;
    }
  };

  // Switch network
  const switchNetwork = async (targetChainId: string): Promise<void> => {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }
    
    try {
      // Check if requested chain exists in our config
      const network = getNetworkDetails(targetChainId);
      if (!network) {
        throw new Error('Unknown chain ID');
      }
      
      // Request chain switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }]
      });
      
      // Chain ID will be updated by the chainChanged event
      // But also update our session
      if (account) {
        const origin = window.location.origin;
        await SessionService.getInstance().updateNetwork(origin, targetChainId);
      }
      
      setChainId(targetChainId);
    } catch (err) {
      const error = err as { code?: number; message?: string };
      // If chain doesn't exist in wallet, try to add it
      if (error.code === 4902) {
        const network = getNetworkDetails(targetChainId);
        if (network) {
          await addNetwork(network);
        }
      }
      
      setError(error.message || 'Failed to switch network');
      throw err;
    }
  };

  // Add a new network
  const addNetwork = async (networkConfig: typeof CHAINS[keyof typeof CHAINS]): Promise<void> => {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
      
      setChainId(networkConfig.chainId);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to add network');
      throw err;
    }
  };

  // Context value
  const value: WalletContextType = {
    connected,
    connecting,
    account,
    balance,
    chainId,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 