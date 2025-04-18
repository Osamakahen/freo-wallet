import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletManager } from '../core/wallet/WalletManager';
import { toast } from 'react-toastify';
import { EthereumEvent, EthereumCallback, EthereumProvider } from '../types/ethereum';

interface WalletContextType {
  walletManager: WalletManager;
  ethereum: EthereumProvider | undefined;
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setChainId: (chainId: string | number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ethereum, setEthereum] = useState<EthereumProvider | undefined>(window.ethereum);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletManager] = useState(() => new WalletManager());

  useEffect(() => {
    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAddress(accounts[0] as string);
        setIsConnected(true);
      } else {
        setAddress(null);
        setIsConnected(false);
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      if (typeof newChainId === 'string') {
        setChainId(newChainId);
      }
    };

    const handleDisconnect = () => {
      setAddress(null);
      setChainId(null);
      setIsConnected(false);
      setError('Wallet disconnected');
    };

    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('disconnect', handleDisconnect);

      // Get initial chain ID
      ethereum.request({ method: 'eth_chainId' })
        .then((id) => {
          if (typeof id === 'string') {
            setChainId(id);
          }
        })
        .catch((err) => {
          console.error('Failed to get chain ID:', err);
        });

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
        ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [ethereum]);

  const connect = async () => {
    if (!ethereum) {
      setError('No Ethereum provider found. Please install MetaMask.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [accounts, chainId] = await Promise.all([
        ethereum.request({ method: 'eth_requestAccounts' }),
        ethereum.request({ method: 'eth_chainId' })
      ]);

      if (Array.isArray(accounts) && accounts.length > 0) {
        setAddress(accounts[0] as string);
        setIsConnected(true);
      }
      if (typeof chainId === 'string') {
        setChainId(chainId);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to connect wallet');
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
  };

  const handleSetChainId = (newChainId: string | number) => {
    if (typeof newChainId === 'number') {
      setChainId(`0x${newChainId.toString(16)}`);
    } else {
      setChainId(newChainId);
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
        loading,
        error,
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
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 