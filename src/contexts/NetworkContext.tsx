import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider, EthereumEvent, EthereumCallback } from '../types/ethereum';

interface NetworkState {
  chainId: string | null;
  isConnected: boolean;
  error: string | null;
}

interface NetworkContextType extends NetworkState {
  switchNetwork: (chainId: string) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  chainId: null,
  isConnected: false,
  error: null,
  switchNetwork: async () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NetworkState>({
    chainId: null,
    isConnected: false,
    error: null,
  });

  const handleChainChanged = (chainId: string) => {
    setState(prev => ({ ...prev, chainId }));
  };

  const handleConnect = () => {
    setState(prev => ({ ...prev, isConnected: true }));
  };

  const handleDisconnect = () => {
    setState(prev => ({ ...prev, isConnected: false }));
  };

  const switchNetwork = async (chainId: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      await provider.send('wallet_switchEthereumChain', [{ chainId }]);
    } catch (error) {
      setState(prev => ({ ...prev, error: (error as Error).message }));
    }
  };

  useEffect(() => {
    const ethereum = window.ethereum as EthereumProvider;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setState(prev => ({ ...prev, isConnected: accounts.length > 0 }));
    };

    ethereum.on('chainChanged', handleChainChanged as EthereumCallback);
    ethereum.on('connect', handleConnect as EthereumCallback);
    ethereum.on('disconnect', handleDisconnect as EthereumCallback);
    ethereum.on('accountsChanged', handleAccountsChanged as EthereumCallback);

    return () => {
      ethereum.removeListener('chainChanged', handleChainChanged as EthereumCallback);
      ethereum.removeListener('connect', handleConnect as EthereumCallback);
      ethereum.removeListener('disconnect', handleDisconnect as EthereumCallback);
      ethereum.removeListener('accountsChanged', handleAccountsChanged as EthereumCallback);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ ...state, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}; 