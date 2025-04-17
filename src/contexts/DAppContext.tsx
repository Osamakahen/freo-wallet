import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DAppBridge } from '../core/dapp/DAppBridge';
import { SessionManager } from '../core/session/SessionManager';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { 
  BridgeConfig, 
  Permission,
  DAppResponse
} from '../types/dapp';
import { TransactionRequest } from '../types/wallet';
import { toast } from 'react-toastify';

interface DAppContextType {
  bridge: DAppBridge;
  isConnected: boolean;
  currentAccount: string | null;
  currentChain: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  requestAccounts: () => Promise<string[]>;
  requestPermissions: (permissions: Permission[]) => Promise<Permission[]>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: TransactionRequest) => Promise<string>;
  loading: boolean;
  error: string | null;
}

const DAppContext = createContext<DAppContextType | undefined>(undefined);

export const DAppProvider: React.FC<{
  children: React.ReactNode;
  config: BridgeConfig;
}> = ({ children, config }) => {
  const [sessionManager] = useState(() => new SessionManager());
  const [keyManager] = useState(() => new KeyManager());
  const [transactionManager] = useState(() => new TransactionManager(config.rpcUrl || '', keyManager));
  const [bridge] = useState(() => new DAppBridge(sessionManager, transactionManager, config));
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState(config.defaultChain || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      setCurrentAccount(accounts[0]);
    };

    const handleChainChanged = (chainId: number) => {
      setCurrentChain(chainId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setCurrentAccount(null);
    };

    bridge.on('accountsChanged', handleAccountsChanged);
    bridge.on('chainChanged', handleChainChanged);
    bridge.on('disconnect', handleDisconnect);

    return () => {
      // Cleanup event listeners
      bridge.on('accountsChanged', () => {});
      bridge.on('chainChanged', () => {});
      bridge.on('disconnect', () => {});
    };
  }, [bridge]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await bridge.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      toast.error('Failed to connect to DApp');
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const disconnect = useCallback(() => {
    try {
      bridge.disconnect();
      setIsConnected(false);
      setCurrentAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      toast.error('Failed to disconnect from DApp');
    }
  }, [bridge]);

  const requestAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const state = bridge.getState();
      if (!state.address) {
        throw new Error('No connected account');
      }
      setCurrentAccount(state.address);
      return [state.address];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request accounts');
      toast.error('Failed to request accounts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const requestPermissions = useCallback(async (permissions: Permission[]) => {
    try {
      setLoading(true);
      setError(null);
      return await bridge.requestPermissions(permissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions');
      toast.error('Failed to request permissions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const signMessage = useCallback(async (message: string) => {
    try {
      setLoading(true);
      setError(null);
      return await bridge.signMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
      toast.error('Failed to sign message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const sendTransaction = useCallback(async (transaction: TransactionRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bridge.sendTransaction(transaction);
      if (response.error) {
        throw new Error(response.error.message || 'Transaction failed');
      }
      return response.result as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const value = {
    bridge,
    isConnected,
    currentAccount,
    currentChain,
    connect,
    disconnect,
    requestAccounts,
    requestPermissions,
    signMessage,
    sendTransaction,
    loading,
    error
  };

  return <DAppContext.Provider value={value}>{children}</DAppContext.Provider>;
};

export const useDApp = () => {
  const context = useContext(DAppContext);
  if (context === undefined) {
    throw new Error('useDApp must be used within a DAppProvider');
  }
  return context;
}; 