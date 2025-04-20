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

      return address;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  }, [keyManager, adapter]);

  // ... rest of the existing code ...
}