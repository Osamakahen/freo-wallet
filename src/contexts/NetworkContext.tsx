import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { mainnet } from 'viem/chains';
import { EthereumProvider } from '../types/ethereum';
import { Chain } from 'viem';

type EthereumEvent = 'chainChanged' | 'accountsChanged' | 'disconnect';
type EthereumCallback = ChainChangedCallback | AccountsChangedCallback | DisconnectCallback;
type ChainChangedCallback = (chainId: string) => void;
type AccountsChangedCallback = (accounts: string[]) => void;
type DisconnectCallback = (error: { code: number; message: string }) => void;

type EthereumProviderType = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: EthereumEvent, callback: EthereumCallback) => void;
  removeListener: (event: EthereumEvent, callback: EthereumCallback) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProviderType;
  }
}

interface NetworkState {
  chainId: number;
  networkName: string;
  symbol: string;
  rpcUrl: string;
  explorer?: string;
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

export interface NetworkContextType {
  chain: Chain | null;
  chainId: number;
  setChain: (chain: Chain) => void;
  isConnected: boolean;
  error: Error | null;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
  value: NetworkContextType;
}

export const NetworkProvider = ({ children, value }: NetworkProviderProps) => {
  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<NetworkState>({
    chainId: mainnet.id,
    networkName: mainnet.name,
    symbol: mainnet.nativeCurrency.symbol,
    rpcUrl: mainnet.rpcUrls.default.http[0],
    explorer: mainnet.blockExplorers?.default.url
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateNetwork = useCallback(async (chainId: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      setNetwork({
        chainId: Number(network.chainId),
        networkName: network.name || `Chain ${network.chainId}`,
        symbol: mainnet.nativeCurrency.symbol,
        rpcUrl: mainnet.rpcUrls.default.http[0],
        explorer: mainnet.blockExplorers?.default.url
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update network');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId: string) => {
      updateNetwork(Number(chainId));
    };

    const ethereum = window.ethereum as EthereumProviderType;
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateNetwork]);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const ethereum = window.ethereum as EthereumProviderType;
      await ethereum.request({
        method: 'walletSwitchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      await updateNetwork(chainId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  }, [updateNetwork]);

  return (
    <NetworkContext.Provider value={{ network, switchNetwork, loading, error }}>
      {children}
    </NetworkContext.Provider>
  );
}; 