import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { mainnet } from 'viem/chains';
import type { EthereumCallback } from '../types/ethereum';

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
  network: NetworkState;
  chainId: number;
  switchNetwork: (chainId: string | number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

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

    const handleChainChanged: EthereumCallback = (params: unknown) => {
      const chainId = typeof params === 'string' ? params : 
                     typeof params === 'object' && params !== null && 'chainId' in params ? 
                     (params as { chainId: string }).chainId : 
                     '0x1';
      updateNetwork(Number(chainId));
    };

    const ethereum = window.ethereum;
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [updateNetwork]);

  const switchNetwork = useCallback(async (chainId: string | number) => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const ethereum = window.ethereum;
      await ethereum.request({
        method: 'walletSwitchEthereumChain',
        params: [{ chainId: typeof chainId === 'string' ? chainId : `0x${chainId.toString(16)}` }],
      });

      await updateNetwork(typeof chainId === 'string' ? parseInt(chainId, 16) : chainId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  }, [updateNetwork]);

  return (
    <NetworkContext.Provider value={{ 
      network, 
      chainId: network.chainId,
      switchNetwork, 
      loading, 
      error 
    }}>
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