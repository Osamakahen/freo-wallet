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
  networkName: 'Ethereum',
  symbol: 'ETH'
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
  const [txManager] = useState(() => new TransactionManager(config.rpcUrl, keyManager));
  const [dappTxManager] = useState(() => new TransactionManager(config.rpcUrl, keyManager));
  const [dappBridge] = useState(() => new DAppBridge(sessionManager, dappTxManager, {
    autoConnect: true,
    sessionTimeout: 3600000,
    maxConnections: 5,
    requireConfirmation: true,
    rpcUrl: config.rpcUrl,
    qrcodeModal: undefined,
    defaultChain: config.chainId
  }));
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Initialize wallet
  useEffect(() => {
    const init = async () => {
      try {
        await keyManager.setup('password');
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
      await keyManager.setup('password');
      const address = await keyManager.getAddress();
      const balance = await adapter.getBalance(address);

      setState(prev => ({
        ...prev,
        address,
        isConnected: true,
        balance,
        network: config.networkName
      }));
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  }, [keyManager, adapter]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      await keyManager.lock();
      setState(prev => ({
        ...prev,
        address: null,
        isConnected: false,
        balance: '0'
      }));
    } catch (error) {
      throw new Error(`Failed to disconnect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  }, [keyManager]);

  // Send transaction
  const sendTransaction = useCallback(async (tx: TransactionRequest) => {
    try {
      if (!state.address) {
        throw new Error('Wallet not connected');
      }
      return await txManager.sendTransaction(tx);
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.address, txManager]);

  // Sign message
  const signMessage = useCallback(async (message: string) => {
    try {
      if (!state.address) {
        throw new Error('Wallet not connected');
      }
      return await keyManager.signMessage(message);
    } catch (error) {
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.address, keyManager]);

  // Connect DApp
  const connectDApp = useCallback(async (dapp: DAppManifest) => {
    try {
      if (!state.address) {
        throw new Error('Wallet not connected');
      }
      await dappBridge.connect();
      const session = dappBridge.getState().address;
      return {
        address: state.address,
        session: session || ''
      };
    } catch (error) {
      throw new Error(`Failed to connect DApp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.address, dappBridge]);

  // Disconnect DApp
  const disconnectDApp = useCallback(async (origin: string) => {
    try {
      await dappBridge.disconnect();
    } catch (error) {
      throw new Error(`Failed to disconnect DApp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [dappBridge]);

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