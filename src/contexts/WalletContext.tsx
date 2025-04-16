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
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
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
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false
  });
  const [error, setError] = useState<string | null>(null);

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
          if (accounts.length > 0) {
            setWallet({
              address: accounts[0],
              isConnected: true
            });
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
      const handleAccountsChanged = (accounts: unknown) => {
        if (Array.isArray(accounts) && accounts.every(account => typeof account === 'string')) {
          if (accounts.length === 0) {
            setWallet({
              address: null,
              isConnected: false
            });
          } else {
            setWallet({
              address: accounts[0] as string,
              isConnected: true
            });
          }
        }
      };

      const handleDisconnect = (error: unknown) => {
        if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
          setWallet({
            address: null,
            isConnected: false
          });
        }
      };

      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged as EthereumCallback);
        window.ethereum.on('disconnect', handleDisconnect as EthereumCallback);
      }

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged as EthereumCallback);
          window.ethereum.removeListener('disconnect', handleDisconnect as EthereumCallback);
        }
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
      const address = accounts[0];
      setWallet({
        address,
        isConnected: true
      });
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
      throw error;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      setWallet({
        address: null,
        isConnected: false
      });
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address: wallet.address,
        isConnected: wallet.isConnected,
        connect,
        disconnect,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 