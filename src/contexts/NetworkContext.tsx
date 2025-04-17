import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { type Address } from 'viem';

type EthereumEvent = 'chainChanged' | 'accountsChanged' | 'disconnect';
type EthereumCallback = ChainChangedCallback | AccountsChangedCallback | DisconnectCallback;
type ChainChangedCallback = (chainId: string) => void;
type AccountsChangedCallback = (accounts: string[]) => void;
type DisconnectCallback = (error: { code: number; message: string }) => void;

interface EthereumProviderType {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: unknown) => void;
  removeListener: (event: string, callback: unknown) => void;
}

declare global {
  interface Window {
    ethereum: EthereumProviderType | undefined;
  }
}

interface NetworkState {
  chainId: number | null;
  networkName: string;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
}

interface NetworkError {
  code: number;
  message: string;
  details?: unknown;
}

interface NetworkResponse<T = unknown> {
  status: number;
  data: T;
  error?: NetworkError;
}

interface NetworkContextType extends NetworkState {
  connect: () => Promise<NetworkResponse<{ connected: boolean; chainId: number }>>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<NetworkResponse<{ chainId: number }>>;
  getProvider: () => ethers.BrowserProvider | null;
  refreshNetwork: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NetworkState>({
    chainId: 1, // Default to Ethereum mainnet
    networkName: 'Ethereum Mainnet',
    isConnected: false,
    provider: null
  });

  const refreshNetwork = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        setState({
          chainId: Number(network.chainId),
          networkName: network.name,
          isConnected: true,
          provider
        });
      }
    } catch (error) {
      console.error('Failed to refresh network:', error);
      setState(prev => ({ ...prev, isConnected: false, provider: null }));
    }
  };

  const connect = async (): Promise<NetworkResponse<{ connected: boolean; chainId: number }>> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      const network = await provider.getNetwork();
      
      setState(prev => ({
        ...prev,
        chainId: Number(network.chainId),
        networkName: network.name,
        isConnected: true,
        provider
      }));

      return {
        status: 200,
        data: {
          connected: true,
          chainId: Number(network.chainId)
        }
      };
    } catch (error) {
      return {
        status: 500,
        data: {
          connected: false,
          chainId: 0
        },
        error: {
          code: 500,
          message: 'Failed to connect to network'
        }
      };
    }
  };

  const switchNetwork = async (chainId: number): Promise<NetworkResponse<{ chainId: number }>> => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });

      await refreshNetwork();

      return {
        status: 200,
        data: { chainId }
      };
    } catch (error) {
      return {
        status: 500,
        data: { chainId: 0 },
        error: {
          code: 500,
          message: 'Failed to switch network'
        }
      };
    }
  };

  const disconnect = () => {
    setState({
      chainId: 1,
      networkName: 'Ethereum Mainnet',
      isConnected: false,
      provider: null
    });
  };

  const getProvider = () => {
    return state.provider;
  };

  useEffect(() => {
    refreshNetwork();

    const ethereum = window.ethereum;
    if (ethereum) {
      const handleChainChanged = (chainId: string) => {
        console.debug('Chain changed:', chainId);
        refreshNetwork();
      };

      const handleAccountsChanged = (accounts: string[]) => {
        console.debug('Accounts changed:', accounts);
        refreshNetwork();
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.debug('Disconnected:', error);
        disconnect();
      };

      ethereum.on('chainChanged', handleChainChanged as ChainChangedCallback);
      ethereum.on('accountsChanged', handleAccountsChanged as AccountsChangedCallback);
      ethereum.on('disconnect', handleDisconnect as DisconnectCallback);

      return () => {
        ethereum.removeListener('chainChanged', handleChainChanged as ChainChangedCallback);
        ethereum.removeListener('accountsChanged', handleAccountsChanged as AccountsChangedCallback);
        ethereum.removeListener('disconnect', handleDisconnect as DisconnectCallback);
      };
    }
  }, []);

  return (
    <NetworkContext.Provider value={{ ...state, connect, disconnect, switchNetwork, getProvider, refreshNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 