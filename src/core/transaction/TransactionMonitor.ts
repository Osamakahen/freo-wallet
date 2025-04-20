import { createPublicClient, http, TransactionReceipt } from 'viem';
import { mainnet } from 'viem/chains';
import { TransactionRequest } from '../../types/wallet';

export class TransactionMonitor {
  private client: ReturnType<typeof createPublicClient>;
  private monitoringTransactions: Map<string, NodeJS.Timeout>;
  private statusCallbacks: Map<string, (status: 'pending' | 'confirmed' | 'failed') => void>;

  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http()
    });
    this.monitoringTransactions = new Map();
    this.statusCallbacks = new Map();
  }

  public async monitorTransaction(
    txHash: string,
    onStatusChange: (status: 'pending' | 'confirmed' | 'failed') => void
  ): Promise<void> {
    if (this.monitoringTransactions.has(txHash)) {
      throw new Error('Transaction is already being monitored');
    }

    this.statusCallbacks.set(txHash, onStatusChange);
    onStatusChange('pending');

    const checkTransaction = async () => {
      try {
        const receipt = await this.client.getTransactionReceipt({ hash: txHash as `0x${string}` });
        
        if (receipt) {
          this.stopMonitoring(txHash);
          const status = receipt.status === 'success' ? 'confirmed' : 'failed';
          onStatusChange(status);
        }
      } catch (error) {
        console.error('Error monitoring transaction:', error);
        this.stopMonitoring(txHash);
        onStatusChange('failed');
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkTransaction, 5000);
    this.monitoringTransactions.set(txHash, interval);

    // Initial check
    await checkTransaction();
  }

  public stopMonitoring(txHash: string): void {
    const interval = this.monitoringTransactions.get(txHash);
    if (interval) {
      clearInterval(interval);
      this.monitoringTransactions.delete(txHash);
      this.statusCallbacks.delete(txHash);
    }
  }

  public isMonitoring(txHash: string): boolean {
    return this.monitoringTransactions.has(txHash);
  }

  public getTransactionStatus(txHash: string): 'pending' | 'confirmed' | 'failed' | null {
    const callback = this.statusCallbacks.get(txHash);
    if (!callback) {
      return null;
    }
    return 'pending'; // Default status, actual status is managed by the callback
  }

  public async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    try {
      return await this.client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    } catch (error) {
      console.error('Error fetching transaction receipt:', error);
      return null;
    }
  }

  public async getTransactionDetails(txHash: string): Promise<TransactionRequest | null> {
    try {
      const tx = await this.client.getTransaction({ hash: txHash as `0x${string}` });
      if (!tx) return null;

      return {
        from: tx.from,
        to: tx.to!,
        value: tx.value.toString(),
        data: tx.input,
        gasLimit: tx.gas.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        nonce: tx.nonce,
        hash: txHash,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }
} 