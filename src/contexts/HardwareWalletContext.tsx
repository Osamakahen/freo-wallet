import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

interface HardwareWalletContextType {
  isConnected: boolean;
  address: string | null;
  balances: Record<string, string>;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: ethers.TransactionRequest) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
}

const HardwareWalletContext = createContext<HardwareWalletContextType | undefined>(undefined);

export const HardwareWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const refreshBalances = useCallback(async () => {
    if (!address || !provider) return;
    // ... existing balance refresh logic ...
  }, [address, provider]);

  useEffect(() => {
    if (provider) {
      refreshBalances();
    }
  }, [provider, refreshBalances]);

  const connect = async () => {
    try {
      setIsConnected(true);
      setAddress(null);
      setProvider(null);
      setBalances({});

      // In a real implementation, this would use the appropriate hardware wallet SDK
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsConnected(true);
      setAddress(null);
      setProvider(null);
      setBalances({});
    } catch (error) {
      console.error('Failed to connect hardware wallet:', error);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setProvider(null);
    setBalances({});
  };

  const signTransaction = async (_transaction: ethers.TransactionRequest): Promise<string> => {
    // Mock implementation using the transaction
    console.log('Signing transaction:', _transaction);
    return '0x123...';
  };

  const signMessage = async (_message: string): Promise<string> => {
    // Mock implementation using the message
    console.log('Signing message:', _message);
    return '0x456...';
  };

  return (
    <HardwareWalletContext.Provider
      value={{
        isConnected,
        address,
        balances,
        connect,
        disconnect,
        signTransaction,
        signMessage,
        refreshBalances
      }}
    >
      {children}
    </HardwareWalletContext.Provider>
  );
};

export const useHardwareWallet = () => {
  const context = useContext(HardwareWalletContext);
  if (context === undefined) {
    throw new Error('useHardwareWallet must be used within a HardwareWalletProvider');
  }
  return context;
}; 