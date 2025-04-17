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

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
  setChainId: (chainId: number) => void;
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
    isConnected: false,
    chainId: 1 // Default to Ethereum Mainnet
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
          const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
          
          if (accounts.length > 0) {
            setWallet({
              address: accounts[0],
              isConnected: true,
              chainId: parseInt(chainId, 16)
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
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWallet(prev => ({
            ...prev,
            address: null,
            isConnected: false
          }));
        } else {
          setWallet(prev => ({
            ...prev,
            address: accounts[0],
            isConnected: true
          }));
        }
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        setWallet(prev => ({
          ...prev,
          address: null,
          isConnected: false
        }));
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
      
      setWallet({
        address: accounts[0],
        isConnected: true,
        chainId: parseInt(chainId, 16)
      });
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
      setWallet(prev => ({
        ...prev,
        address: null,
        isConnected: false
      }));
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
      throw error;
    }
  };

  const setChainId = (chainId: number) => {
    try {
      setWallet(prev => ({
        ...prev,
        chainId
      }));
    } catch (error) {
      const walletError = handleError(error);
      setError(walletError.message);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address: wallet.address,
        isConnected: wallet.isConnected,
        chainId: wallet.chainId,
        connect,
        disconnect,
        error,
        setChainId
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 