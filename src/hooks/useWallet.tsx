import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Address } from 'viem';

interface WalletState {
  address: Address | null;
  isConnected: boolean;
  balance: string;
  chainId: number;
  network: string;
}

interface WalletContextType {
  state: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const initialState: WalletState = {
  address: null,
  isConnected: false,
  balance: '0',
  chainId: 1,
  network: 'Ethereum'
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0] as Address;

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkId = parseInt(chainId as string, 16);

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const balanceInEth = parseInt(balance as string, 16) / 1e18;

      setState({
        address,
        isConnected: true,
        balance: balanceInEth.toFixed(4),
        chainId: networkId,
        network: 'Ethereum'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState(initialState);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        state,
        connect,
        disconnect,
        isConnecting,
        error
      }}
    >
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