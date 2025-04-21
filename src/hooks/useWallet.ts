import { useCallback, useEffect } from 'react';
import { type Address } from 'viem';
import useWalletStore from '../store/walletStore';
import { EthereumProvider } from '../types/global';

type AccountsChangedHandler = (accounts: string[]) => void;
type ChainChangedHandler = (chainId: string) => void;
type DisconnectHandler = () => void;

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

  const handleAccountsChanged: AccountsChangedHandler = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0] as `0x${string}`);
    }
  }, [setAddress]);

  const handleChainChanged: ChainChangedHandler = useCallback((chainId) => {
    setChainId(parseInt(chainId, 16));
  }, [setChainId]);

  const handleDisconnect: DisconnectHandler = useCallback(() => {
    disconnect();
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;

      const balance = (await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      })) as string;

      setAddress(accounts[0] as `0x${string}`);
      setChainId(parseInt(chainId, 16));
      setBalance(balance);
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setBalance('0');
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  }, [setAddress, setConnected, setBalance, setError, handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

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