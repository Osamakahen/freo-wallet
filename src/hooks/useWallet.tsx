import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Address } from 'viem';
import useWalletStore from '../store/walletStore';

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
  const {
    address,
    isConnected,
    balance,
    chainId,
    network,
    isConnecting,
    error,
    setConnected,
    setAddress,
    setBalance,
    setChainId,
    setNetwork,
    setConnecting,
    setError
  } = useWalletStore();

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask.');
      return;
    }

    try {
      setConnecting(true);
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

      setAddress(address);
      setConnected(true);
      setBalance(balanceInEth.toFixed(4));
      setChainId(networkId);
      setNetwork('Ethereum');

      // Setup event listeners
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0] as Address);
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });

      window.ethereum.on('disconnect', () => {
        disconnect();
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [setAddress, setConnected, setBalance, setChainId, setNetwork, setConnecting, setError]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setBalance('0');
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', () => {});
      window.ethereum.removeListener('chainChanged', () => {});
      window.ethereum.removeListener('disconnect', () => {});
    }
  }, [setAddress, setConnected, setBalance, setError]);

  return {
    state: {
      address,
      isConnected,
      balance,
      chainId,
      network
    },
    connect,
    disconnect,
    isConnecting,
    error
  };
}