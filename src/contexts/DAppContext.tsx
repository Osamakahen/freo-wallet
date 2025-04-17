import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DAppBridge } from '../core/dapp/DAppBridge';
import { SessionManager } from '../core/session/SessionManager';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { 
  BridgeConfig, 
  TransactionRequest, 
  SessionPermissions, 
  DAppManifest, 
  DAppPermission, 
  Permission, 
  DAppResponse,
  BridgeEvents
} from '../types/dapp';
import { TransactionRequest as WalletTransactionRequest } from '../types/wallet';
import { toast } from 'react-toastify';
import { type Address } from 'viem';

interface DAppContextType {
  bridge: DAppBridge;
  isConnected: boolean;
  currentAccount: Address | null;
  currentChain: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  requestAccounts: () => Promise<string[]>;
  requestPermissions: (permissions: Permission[]) => Promise<Permission[]>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: TransactionRequest) => Promise<DAppResponse>;
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
  const [currentAccount, setCurrentAccount] = useState<Address | null>(null);
  const [currentChain, setCurrentChain] = useState(config.defaultChain || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      setCurrentAccount(accounts[0] as Address);
    };

    const handleChainChanged = (chainId: number) => {
      setCurrentChain(chainId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setCurrentAccount(null);
    };

    // Set up event listeners
    bridge.on('accountsChanged', handleAccountsChanged);
    bridge.on('chainChanged', handleChainChanged);
    bridge.on('disconnect', handleDisconnect);

    // Clean up event listeners
    return () => {
      // Since DAppBridge uses a simple event system, we just need to set the callbacks to no-op
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
      const state = bridge.getState();
      if (state.address) {
        setCurrentAccount(state.address as Address);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await bridge.disconnect();
      setIsConnected(false);
      setCurrentAccount(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const requestAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await bridge.requestAccounts();
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0] as Address);
      }
      return accounts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request accounts';
      setError(errorMessage);
      toast.error(errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permissions';
      setError(errorMessage);
      toast.error(errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign message';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const sendTransaction = useCallback(async (transaction: TransactionRequest) => {
    try {
      setLoading(true);
      setError(null);
      if (!currentAccount) {
        throw new Error('No connected account');
      }
      const walletTransaction: WalletTransactionRequest = {
        ...transaction,
        from: currentAccount,
      };
      return await bridge.sendTransaction(walletTransaction);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge, currentAccount]);

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