import { NetworkManager } from '../network/NetworkManager';

export interface TransactionRecord {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: number;
  nonce: number;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  error?: string;
}

export class TransactionHistory {
  private static readonly STORAGE_KEY = 'freo_wallet_transactions';
  private transactions: Map<string, TransactionRecord>;
  private networkManager: NetworkManager;

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
    this.transactions = new Map();
    this.loadTransactions();
  }

  /**
   * Adds a new transaction to history
   */
  addTransaction(tx: TransactionRecord): void {
    this.transactions.set(tx.hash, tx);
    this.saveTransactions();
  }

  /**
   * Updates an existing transaction
   */
  updateTransaction(hash: string, update: Partial<TransactionRecord>): void {
    const tx = this.transactions.get(hash);
    if (tx) {
      this.transactions.set(hash, { ...tx, ...update });
      this.saveTransactions();
    }
  }

  /**
   * Gets a transaction by hash
   */
  getTransaction(hash: string): TransactionRecord | undefined {
    return this.transactions.get(hash);
  }

  /**
   * Gets all transactions for an address
   */
  getTransactionsForAddress(address: string): TransactionRecord[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.from.toLowerCase() === address.toLowerCase() || 
                   tx.to.toLowerCase() === address.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Gets all transactions for the current network
   */
  getTransactionsForCurrentNetwork(): TransactionRecord[] {
    const currentChainId = this.networkManager.getCurrentNetwork().chainId;
    return Array.from(this.transactions.values())
      .filter(tx => tx.chainId === currentChainId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Gets pending transactions
   */
  getPendingTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clears transaction history
   */
  clearHistory(): void {
    this.transactions.clear();
    this.saveTransactions();
  }

  /**
   * Gets the explorer URL for a transaction
   */
  getTransactionExplorerUrl(hash: string): string {
    return this.networkManager.getTransactionExplorerUrl(hash);
  }

  /**
   * Saves transactions to local storage
   */
  private saveTransactions(): void {
    const data = Array.from(this.transactions.entries());
    localStorage.setItem(TransactionHistory.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Loads transactions from local storage
   */
  private loadTransactions(): void {
    const data = localStorage.getItem(TransactionHistory.STORAGE_KEY);
    if (data) {
      const entries = JSON.parse(data);
      this.transactions = new Map(entries);
    }
  }

  /**
   * Updates pending transaction statuses
   */
  async updatePendingTransactions(): Promise<void> {
    const pending = this.getPendingTransactions();
    for (const tx of pending) {
      try {
        const receipt = await window.ethereum?.request({
          method: 'eth_getTransactionReceipt',
          params: [tx.hash],
        });

        if (receipt) {
          this.updateTransaction(tx.hash, {
            status: receipt.status ? 'confirmed' : 'failed',
            gasUsed: receipt.gasUsed,
            blockNumber: parseInt(receipt.blockNumber, 16),
          });
        }
      } catch (error) {
        console.error(`Failed to update transaction ${tx.hash}:`, error);
      }
    }
  }

  /**
   * Gets transaction statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
  } {
    const txs = Array.from(this.transactions.values());
    return {
      total: txs.length,
      pending: txs.filter(tx => tx.status === 'pending').length,
      confirmed: txs.filter(tx => tx.status === 'confirmed').length,
      failed: txs.filter(tx => tx.status === 'failed').length,
    };
  }
} 