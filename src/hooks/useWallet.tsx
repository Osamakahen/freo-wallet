import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { SessionManager } from '../core/session/SessionManager';
import { EVMAdapter } from '../core/adapters/EVMAdapter';
import { DAppBridge } from '../core/dapp/DAppBridge';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { WalletConfig, WalletState, TransactionRequest, DAppManifest } from '../types/wallet';

const defaultConfig: WalletConfig = {
  chainId: 1, // Ethereum Mainnet
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  networkName: 'Ethereum'
};

const initialState: WalletState = {
  address: null,
  isConnected: false,
  isInitialized: false,
  chainId: defaultConfig.chainId,
  balance: '0',
  network: defaultConfig.networkName
};

interface WalletContextType {
  state: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (tx: TransactionRequest) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  connectDApp: (dapp: DAppManifest) => Promise<{ address: string; session: string }>;
  disconnectDApp: (origin: string) => Promise<void>;
  isConnecting: boolean;
  error: string | undefined;
}

interface WalletProviderProps {
  children: ReactNode;
  config?: WalletConfig;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children, config = defaultConfig }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>(initialState);
  const [keyManager] = useState(() => new KeyManager());
  const [sessionManager] = useState(() => new SessionManager());
  const [adapter] = useState(() => new EVMAdapter(config));
  const [dappBridge] = useState(() => new DAppBridge(sessionManager, keyManager));
  const [txManager] = useState(() => new TransactionManager(adapter, keyManager));
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Initialize wallet
  useEffect(() => {
    const init = async () => {
      try {
        await keyManager.initialize();
        const address = await keyManager.getAddress();
        const balance = await adapter.getBalance(address);
        
        setState(prev => ({
          ...prev,
          address,
          isConnected: true,
          isInitialized: true,
          balance,
          network: config.networkName
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isInitialized: true
        }));
      }
    };

    init();
  }, [keyManager, adapter, config.networkName]);

  // Connect wallet
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const mnemonic = await keyManager.createWallet();
      const address = await keyManager.getAddress();
      const balance = await adapter.getBalance(address);

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        balance,
        network: config.networkName
      }));

      return mnemonic;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  }, [keyManager, adapter, config.networkName]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await keyManager.clear();
      sessionManager.revokeAllSessions();

      setState(prev => ({
        ...prev,
        address: null,
        isConnected: false,
        balance: '0'
      }));
    } catch (error) {
      throw new Error(`Failed to disconnect wallet: ${error}`);
    }
  }, [keyManager, sessionManager]);

  // Send transaction
  const sendTransaction = useCallback(async (tx: TransactionRequest): Promise<string> => {
    if (!state.isConnected) throw new Error('Wallet not connected');

    try {
      const txId = await txManager.createTransaction(tx);
      return await txManager.sendTransaction(txId);
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }, [txManager, state.isConnected]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected) throw new Error('Wallet not connected');

    try {
      return await keyManager.signMessage(message);
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }, [keyManager, state.isConnected]);

  // Connect dApp
  const connectDApp = useCallback(async (dapp: DAppManifest) => {
    if (!state.isConnected) throw new Error('Wallet not connected');
    return await dappBridge.connect(dapp.origin, dapp);
  }, [dappBridge, state.isConnected]);

  // Disconnect dApp
  const disconnectDApp = useCallback(async (origin: string) => {
    await dappBridge.disconnect(origin);
  }, [dappBridge]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setState(prev => ({
            ...prev,
            address: accounts[0] as `0x${string}`
          }));
        } else {
          setState(prev => ({
            ...prev,
            address: null,
            isConnected: false
          }));
        }
      };

      const handleDisconnect = () => {
        setState(prev => ({
          ...prev,
          address: null,
          isConnected: false
        }));
        setIsConnecting(false);
        setError(undefined);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, []);

  const value = {
    state,
    connect,
    disconnect,
    sendTransaction,
    signMessage,
    connectDApp,
    disconnectDApp,
    isConnecting,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 