import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Address } from 'viem';
import { type TransactionRequest, type TokenBalance, ExtendedTransactionRequest } from '../types/wallet';

interface WalletStoreState {
  address: Address | null;
  isConnected: boolean;
  balance: string;
  chainId: number;
  network: string;
  transactions: ExtendedTransactionRequest[];
  pendingTransactions: ExtendedTransactionRequest[];
  tokens: TokenBalance[];
  selectedToken: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  isSending: boolean;
  error: string | null;
  setConnected: (connected: boolean) => void;
  setAddress: (address: Address | null) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number) => void;
  setNetwork: (network: string) => void;
  addTransaction: (transaction: ExtendedTransactionRequest) => void;
  updateTransaction: (hash: string, updates: Partial<ExtendedTransactionRequest>) => void;
  setTokens: (tokens: TokenBalance[]) => void;
  setSelectedToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;
}

const useWalletStore = create<WalletStoreState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      balance: '',
      chainId: 1,
      network: 'mainnet',
      transactions: [],
      pendingTransactions: [],
      tokens: [],
      selectedToken: null,
      isLoading: false,
      isConnecting: false,
      isSending: false,
      error: null,
      setConnected: (connected) => set({ isConnected: connected }),
      setAddress: (address) => set({ address }),
      setBalance: (balance) => set({ balance }),
      setChainId: (chainId) => set({ chainId }),
      setNetwork: (network) => set({ network }),
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, transaction],
        pendingTransactions: transaction.status === 'pending' 
          ? [...state.pendingTransactions, transaction]
          : state.pendingTransactions
      })),
      updateTransaction: (hash, updates) => set((state) => {
        const updatedTransactions = state.transactions.map((tx) =>
          tx.hash === hash ? { ...tx, ...updates } : tx
        );

        return {
          transactions: updatedTransactions,
          pendingTransactions: updatedTransactions.filter((tx) => tx.status === 'pending')
        };
      }),
      setTokens: (tokens) => set({ tokens }),
      setSelectedToken: (token) => set({ selectedToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setSending: (sending) => set({ isSending: sending }),
      setError: (error) => set({ error }),
      clearTransactions: () => set({ transactions: [], pendingTransactions: [] }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);

export default useWalletStore; 