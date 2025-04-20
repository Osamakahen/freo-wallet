import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Address } from 'viem';
import { type TransactionRequest, type TokenBalance } from '../types/wallet';

type ExtendedTransactionRequest = TransactionRequest & {
  hash: string;
  status: 'pending' | 'completed' | 'failed';
};

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
  addTransaction: (transaction: TransactionRequest & { hash: string; status: 'pending' | 'completed' | 'failed' }) => void;
  updateTransaction: (hash: string, updates: Partial<TransactionRequest & { status: 'pending' | 'completed' | 'failed' }>) => void;
  setTokens: (tokens: TokenBalance[]) => void;
  setSelectedToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
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
        pendingTransactions: [...state.pendingTransactions, transaction],
      })),
      updateTransaction: (hash, updates) => set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.hash === hash ? { ...tx, ...updates } : tx
        ),
        pendingTransactions: state.pendingTransactions.filter((tx) => tx.hash !== hash),
      })),
      setTokens: (tokens) => set({ tokens }),
      setSelectedToken: (token) => set({ selectedToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setSending: (sending) => set({ isSending: sending }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);

export default useWalletStore; 