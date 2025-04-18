import React, { createContext, useContext, useState, useEffect } from 'react';

type EthereumEvent = 'accountsChanged' | 'disconnect';
type EthereumCallback = 
  | ((accounts: string[]) => void)
  | ((error: { code: number; message: string }) => void);

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: EthereumEvent, callback: EthereumCallback) => void;
      removeListener: (event: EthereumEvent, callback: EthereumCallback) => void;
    };
  }
}

interface WalletError {
  code: number;
  message: string;
  details?: unknown;
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number;
}

interface WalletContextType {
  walletManager: WalletManager;
  ethereum: EthereumProvider | undefined;
  address: string | null;
  chainId: string | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setChainId: (chainId: string) => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ethereum, setEthereum] = useState<EthereumProvider | undefined>(window.ethereum);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletManager] = useState(() => new WalletManager());

  const handleError = (error: unknown): WalletError => {
    if (error instanceof Error) {
      return {
        code: 500,
        message: error.message
      };
    }
    return {
      code: 500,
      message: 'Unknown error occurred'
    };
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
          const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setChainId(chainId);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          setChainId(null);
        } else {
          setAddress(accounts[0]);
          setChainId(accounts[0]);
        }
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        setAddress(null);
        setChainId(null);
        setError(error.message);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('disconnect', handleDisconnect);
      };
    }
  }, []);

  const connect = async (): Promise<void> => {
    if (!window.ethereum) {
      const error = handleError(new Error('No Ethereum wallet found. Please install MetaMask.'));
      setError(error.message);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      
      setAddress(accounts[0]);
      setChainId(chainId);
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
      throw error;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'wallet_revokePermissions' });
      }
      setAddress(null);
      setChainId(null);
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
      throw error;
    }
  };

  const handleSetChainId = (newChainId: string) => {
    setChainId(newChainId);
  };

  return (
    <WalletContext.Provider
      value={{
        walletManager,
        ethereum,
        address,
        chainId,
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