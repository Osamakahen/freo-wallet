import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DAppBridge } from '../core/dapp/DAppBridge';
import { SessionManager } from '../core/session/SessionManager';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { BridgeConfig, DAppSession, Permission, DAppResponse } from '../types/dapp';
import { TransactionRequest } from '../types/wallet';
import { toast } from '../components/ui/use-toast';

interface SessionPermissions {
  read: boolean;
  write: boolean;
  sign: boolean;
  nft: boolean;
}

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
  sendTransaction: (transaction: TransactionRequest) => Promise<DAppResponse>;
  loading: boolean;
  error: string | null;
  connectedDApps: DAppSession[];
  disconnectDApp: (dappId: string) => Promise<void>;
}

const DAppContext = createContext<DAppContextType | undefined>(undefined);

export const DAppProvider: React.FC<{
  children: React.ReactNode;
  config: BridgeConfig;
}> = ({ children, config }) => {
  const [sessionManager] = useState(() => new SessionManager());
  const [keyManager] = useState(() => new KeyManager());
  const [transactionManager] = useState(() => new TransactionManager(config.rpcUrl || '', keyManager));
  const [bridge] = useState(() => DAppBridge.getInstance(sessionManager, transactionManager, config));
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState(config.defaultChain || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedDApps, setConnectedDApps] = useState<DAppSession[]>([]);

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
      // Set empty callbacks to clean up
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
      toast({
        title: "Connection Error",
        description: err instanceof Error ? err.message : 'Failed to connect to DApp',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const disconnect = useCallback(() => {
    try {
      bridge.disconnect();
      setIsConnected(false);
      setCurrentAccount(null);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from DApp",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to disconnect from DApp",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to request accounts",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to request permissions",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to sign message",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const sendTransaction = useCallback(async (transaction: TransactionRequest) => {
    try {
      setLoading(true);
      setError(null);
      return await bridge.sendTransaction(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send transaction",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge]);

  const disconnectDApp = useCallback(async (dappId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to end the session
      await sessionManager.endSession(dappId);
      
      // Then disconnect the bridge
      bridge.disconnect();
      
      // Update the UI state
      setConnectedDApps(prev => prev.filter(dapp => dapp.dappId !== dappId));
      
      // If this was the last connected DApp, reset the connection state
      const remainingSessions = await sessionManager.getSessions();
      if (remainingSessions.length === 0) {
        setIsConnected(false);
        setCurrentAccount(null);
      }
      
      toast({
        title: "DApp Disconnected",
        description: "Successfully disconnected from the DApp",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to disconnect from DApp",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [bridge, sessionManager]);

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
    error,
    connectedDApps,
    disconnectDApp
  };

  return (
    <DAppContext.Provider value={value}>
      {children}
    </DAppContext.Provider>
  );
};

export const useDApp = () => {
  const context = useContext(DAppContext);
  if (context === undefined) {
    throw new Error('useDApp must be used within a DAppProvider');
  }
  return context;
}; 