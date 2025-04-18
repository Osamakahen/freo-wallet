import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { mainnet } from 'viem/chains';
import { Address } from 'viem';

interface NetworkState {
  chainId: number;
  networkName: string;
  symbol: string;
  rpcUrl: string;
  explorer?: string;
  address: Address | null;
  isConnected: boolean;
  error: string | null;
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

export interface NetworkContextType extends NetworkState {
  setChainId: (chainId: number) => void;
  setAddress: (address: Address | null) => void;
  setIsConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  switchNetwork: (chainId: string | number) => Promise<void>;
  loading: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkState>({
    chainId: mainnet.id,
    networkName: mainnet.name,
    symbol: mainnet.nativeCurrency.symbol,
    rpcUrl: mainnet.rpcUrls.default.http[0],
    explorer: mainnet.blockExplorers?.default.url,
    address: null,
    isConnected: false,
    error: null
  });
  const [loading, setLoading] = useState(false);

  const updateNetwork = useCallback(async (chainId: number) => {
    try {
      setLoading(true);
      setNetwork(prev => ({ ...prev, error: null }));

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
        explorer: mainnet.blockExplorers?.default.url,
        address: null,
        isConnected: true,
        error: null
      });
    } catch (err) {
      setNetwork(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to update network' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (params: unknown) => {
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
      setNetwork(prev => ({ ...prev, error: null }));

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
      setNetwork(prev => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to switch network' }));
    } finally {
      setLoading(false);
    }
  }, [updateNetwork]);

  const setChainId = (chainId: number) => {
    setNetwork(prev => ({ ...prev, chainId }));
  };

  const setAddress = (address: Address | null) => {
    setNetwork(prev => ({ ...prev, address }));
  };

  const setIsConnected = (isConnected: boolean) => {
    setNetwork(prev => ({ ...prev, isConnected }));
  };

  const setError = (error: string | null) => {
    setNetwork(prev => ({ ...prev, error }));
  };

  return (
    <NetworkContext.Provider
      value={{
        ...network,
        setChainId,
        setAddress,
        setIsConnected,
        setError,
        switchNetwork,
        loading
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
} 