import React, { createContext, useContext, useState } from 'react';
import { TransactionRequest, TransactionReceipt } from '../types/wallet';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { useWallet } from './WalletContext';
import { GasSettings } from '../types/gas';

interface TransactionContextType {
  pendingTransactions: TransactionRequest[];
  transactionHistory: TransactionReceipt[];
  loading: boolean;
  error: string | null;
  sendTransaction: (request: TransactionRequest) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  getTransactionStatus: (hash: string) => Promise<'pending' | 'confirmed' | 'failed' | null>;
  getTransactionReceipt: (hash: string) => Promise<TransactionReceipt | null>;
  cancelTransaction: (hash: string, gasSettings: GasSettings) => Promise<string>;
  refreshHistory: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType>({
  pendingTransactions: [],
  transactionHistory: [],
  loading: false,
  error: null,
  sendTransaction: async () => '',
  signMessage: async () => '',
  getTransactionStatus: async () => null,
  getTransactionReceipt: async () => null,
  cancelTransaction: async () => '',
  refreshHistory: async () => {}
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected } = useWallet();
  const [pendingTransactions, setPendingTransactions] = useState<TransactionRequest[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyManager] = useState(() => new KeyManager());
  const [transactionManager] = useState(() => new TransactionManager('http://localhost:8545', keyManager));

  const sendTransaction = async (request: TransactionRequest): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const hash = await transactionManager.sendTransaction(request);
      setPendingTransactions(prev => [...prev, request]);
      return hash;
    } catch (err) {
      setError('Failed to send transaction');
      console.error('Failed to send transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      return await transactionManager.signMessage(message);
    } catch (err) {
      setError('Failed to sign message');
      console.error('Failed to sign message:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionStatus = async (hash: string) => {
    try {
      return await transactionManager.getTransactionStatus(hash as `0x${string}`);
    } catch (err) {
      console.error('Failed to get transaction status:', err);
      return null;
    }
  };

  const getTransactionReceipt = async (hash: string) => {
    try {
      return await transactionManager.getTransactionReceipt(hash as `0x${string}`);
    } catch (err) {
      console.error('Failed to get transaction receipt:', err);
      return null;
    }
  };

  const cancelTransaction = async (hash: string, gasSettings: GasSettings): Promise<string> => {
    if (!address) throw new Error('No connected account');

    try {
      setLoading(true);
      setError(null);
      const tx = await transactionManager.getTransaction(hash);
      if (!tx || !tx.nonce) throw new Error('Transaction not found');

      return await transactionManager.cancelTransaction(address as `0x${string}`, tx.nonce, gasSettings);
    } catch (err) {
      setError('Failed to cancel transaction');
      console.error('Failed to cancel transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      setError(null);
      const history = await transactionManager.getTransactionHistory(address as `0x${string}`);
      
      const receipts = await Promise.all(
        history.map(async (tx) => {
          // Find the pending transaction that matches this transaction's properties
          const pendingTxs = transactionManager.getPendingTransactions();
          const pendingTx = pendingTxs.find(pending => 
            pending.from === tx.from &&
            pending.to === tx.to &&
            pending.value === tx.value &&
            pending.nonce === tx.nonce
          );
          
          if (!pendingTx) return null;
          
          // Get the transaction details from the transaction manager
          const txDetails = await transactionManager.getTransactionDetails(tx.from + '_' + tx.nonce);
          if (!txDetails) return null;

          const status = await transactionManager.getTransactionStatus(tx.from + '_' + tx.nonce);
          if (status === 'confirmed') {
            const receipt = await transactionManager.getTransactionReceipt(tx.from + '_' + tx.nonce);
            return receipt;
          }
          return null;
        })
      );
      setTransactionHistory(receipts.filter((receipt): receipt is TransactionReceipt => receipt !== null));
    } catch (err) {
      setError('Failed to refresh transaction history');
      console.error('Failed to refresh transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    pendingTransactions,
    transactionHistory,
    loading,
    error,
    sendTransaction,
    signMessage,
    getTransactionStatus,
    getTransactionReceipt,
    cancelTransaction,
    refreshHistory
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}; 