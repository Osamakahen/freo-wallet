import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletManager } from '../core/wallet/WalletManager';
import { toast } from 'react-toastify';
import { EthereumEvent, EthereumCallback, EthereumProvider } from '../types/ethereum';

interface WalletContextType {
  walletManager: WalletManager;
  ethereum: EthereumProvider | undefined;
  address: string | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ethereum, setEthereum] = useState<EthereumProvider | undefined>(window.ethereum);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletManager] = useState(() => new WalletManager());

  useEffect(() => {
    const handleAccountsChanged = (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAddress(accounts[0] as string);
      } else {
        setAddress(null);
      }
    };

    const handleDisconnect = () => {
      setAddress(null);
      setError('Wallet disconnected');
    };

    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('disconnect', handleDisconnect);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
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
      
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (Array.isArray(accounts) && accounts.length > 0) {
        setAddress(accounts[0] as string);
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
  };

  return (
    <WalletContext.Provider
      value={{
        walletManager,
        ethereum,
        address,
        loading,
        error,
        connect,
        disconnect
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