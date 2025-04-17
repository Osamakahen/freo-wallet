import React, { createContext, useContext, useState, useEffect } from 'react';
import { NetworkManager } from '../core/network/NetworkManager';
import { toast } from 'react-toastify';
import { mainnet } from 'viem/chains';

type EthereumEvent = 'chainChanged' | 'accountsChanged' | 'disconnect';
type EthereumCallback = (params: unknown) => void;

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: EthereumEvent, callback: EthereumCallback) => void;
  removeListener: (event: EthereumEvent, callback: EthereumCallback) => void;
}

interface NetworkContextType {
  networkManager: NetworkManager;
  ethereum: EthereumProvider | undefined;
  chainId: string | null;
  loading: boolean;
  error: string | null;
  switchNetwork: (chainId: string) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkManager] = useState(() => new NetworkManager({
    networkName: mainnet.name,
    chainId: mainnet.id,
    rpcUrl: mainnet.rpcUrls.default.http[0]
  }));
  const ethereum = typeof window !== 'undefined' ? (window.ethereum as EthereumProvider) : undefined;
  const [chainId, setChainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleChainChanged = (params: unknown) => {
      const newChainId = params as string;
      setChainId(newChainId);
      toast.info(`Network changed to ${newChainId}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    };

    const handleAccountsChanged = (params: unknown) => {
      const accounts = params as string[];
      if (accounts.length === 0) {
        toast.warning('Please connect your wallet', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    if (ethereum) {
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [ethereum]);

  const switchNetwork = async (chainId: string) => {
    try {
      setLoading(true);
      setError(null);
      await networkManager.switchNetwork({
        networkName: mainnet.name,
        chainId: parseInt(chainId),
        rpcUrl: mainnet.rpcUrls.default.http[0]
      });
      setChainId(chainId);
      toast.success(`Switched to network ${chainId}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
      toast.error('Failed to switch network', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        networkManager,
        ethereum,
        chainId,
        loading,
        error,
        switchNetwork
      }}
    >
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