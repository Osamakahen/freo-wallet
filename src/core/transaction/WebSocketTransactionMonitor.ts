import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionSubscription {
  hash: `0x${string}`;
  callback: (status: TransactionStatus) => void;
  interval?: NodeJS.Timeout;
}

export class WebSocketTransactionMonitor {
  private publicClient: ReturnType<typeof createPublicClient>;
  private subscriptions: Map<`0x${string}`, TransactionSubscription>;
  private pollingInterval: number;

  constructor(pollingInterval: number = 5000) {
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });
    this.subscriptions = new Map();
    this.pollingInterval = pollingInterval;
  }

  async monitorTransaction(hash: `0x${string}`): Promise<void> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      
      const subscription = this.subscriptions.get(hash);
      if (subscription) {
        const status = receipt ? (receipt.status === 'success' ? 'confirmed' : 'failed') : 'pending';
        subscription.callback(status);
        if (status !== 'pending') {
          this.stopMonitoring(hash);
        }
      }
    } catch (error) {
      const subscription = this.subscriptions.get(hash);
      if (subscription) {
        subscription.callback('failed');
        this.stopMonitoring(hash);
      }
    }
  }

  subscribe(hash: `0x${string}`, callback: (status: TransactionStatus) => void): () => void {
    if (this.subscriptions.has(hash)) {
      return () => this.stopMonitoring(hash);
    }

    const subscription: TransactionSubscription = {
      hash,
      callback,
      interval: setInterval(() => this.monitorTransaction(hash), this.pollingInterval)
    };

    this.subscriptions.set(hash, subscription);

    // Initial check
    this.monitorTransaction(hash);

    return () => this.stopMonitoring(hash);
  }

  stopMonitoring(hash: `0x${string}`): void {
    const subscription = this.subscriptions.get(hash);
    if (subscription) {
      if (subscription.interval) {
        clearInterval(subscription.interval);
      }
      this.subscriptions.delete(hash);
    }
  }

  stopAllMonitoring(): void {
    for (const [hash] of this.subscriptions) {
      this.stopMonitoring(hash);
    }
  }
} 