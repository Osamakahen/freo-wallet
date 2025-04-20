import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther,
  formatEther,
  Address,
  WalletClient,
  PublicClient
} from 'viem';
import { mainnet } from 'viem/chains';
import { KeyManager } from '../keyManagement/KeyManager';
import { TransactionRequest, TransactionReceipt, TransactionLog } from '../../types/wallet';
import { TransactionError } from '../errors/WalletErrors';
import { TransactionMonitor } from './TransactionMonitor';
import { GasSettings } from '../../types/gas';

interface PendingTransaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  request: TransactionRequest;
}

export class TransactionManager {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private keyManager: KeyManager;
  private pendingTransactions: Map<string, PendingTransaction> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private monitor: TransactionMonitor;

  constructor(rpcUrl: string, keyManager: KeyManager) {
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl)
    });

    this.walletClient = createWalletClient({
      chain: mainnet,
      transport: http(rpcUrl)
    });

    this.keyManager = keyManager;
    this.monitor = new TransactionMonitor();
    this.startTransactionMonitoring();
  }

  private startTransactionMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      for (const [hash, tx] of this.pendingTransactions) {
        if (tx.status === 'pending') {
          await this.monitorTransaction(hash as `0x${string}`);
        }
      }
    }, 5000);
  }

  private stopTransactionMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async getGasSettings(): Promise<GasSettings> {
    try {
      const [baseFee, priorityFee] = await Promise.all([
        this.publicClient.getBlock().then(block => block.baseFeePerGas || 0n),
        this.publicClient.estimateMaxPriorityFeePerGas()
      ]);
      return {
        maxFeePerGas: formatEther(baseFee),
        maxPriorityFeePerGas: formatEther(priorityFee),
        gasLimit: '21000'
      };
    } catch (error) {
      throw new TransactionError(
        `Failed to get gas settings: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async createTransaction(request: TransactionRequest): Promise<TransactionRequest> {
    if (!request.to) {
      throw new Error('Recipient address is required');
    }

    const address = await this.keyManager.getAddress();
    if (!address) {
      throw new Error('No connected account found');
    }

    if (request.nonce === undefined) {
      request.nonce = await this.publicClient.getTransactionCount({
        address
      });
    }

    if (!request.gasLimit) {
      const gasEstimate = await this.publicClient.estimateGas({
        account: address,
        to: request.to,
        value: request.value ? BigInt(request.value) : undefined,
        data: request.data as `0x${string}` | undefined
      });
      request.gasLimit = gasEstimate.toString();
    }

    return request;
  }

  public async sendTransaction(request: TransactionRequest): Promise<string> {
    const address = await this.keyManager.getAddress();
    if (!address) {
      throw new Error('No connected account found');
    }

    const tx = await this.createTransaction(request);
    
    try {
      const hash = await this.walletClient.sendTransaction({
        account: address,
        to: tx.to,
        value: tx.value ? BigInt(tx.value) : undefined,
        data: tx.data as `0x${string}` | undefined,
        gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
        maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
        nonce: tx.nonce,
        chain: mainnet
      });

      this.pendingTransactions.set(hash, {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        request: tx
      });
      return hash;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async signMessage(message: string): Promise<string> {
    const address = await this.keyManager.getAddress();
    if (!address) {
      throw new Error('No connected account found');
    }

    try {
      return await this.walletClient.signMessage({
        account: address,
        message
      });
    } catch (error) {
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async monitorTransaction(
    hash: `0x${string}`
  ): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      const tx = await this.publicClient.getTransaction({ hash });
      return {
        hash: receipt.transactionHash,
        status: receipt.status,
        blockNumber: Number(receipt.blockNumber),
        blockHash: receipt.blockHash,
        transactionIndex: Number(receipt.transactionIndex),
        from: receipt.from,
        to: receipt.to || null,
        contractAddress: receipt.contractAddress || null,
        logs: receipt.logs.map(log => ({
          ...log,
          blockNumber: Number(log.blockNumber)
        })),
        logsBloom: receipt.logsBloom,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        type: receipt.type,
        timestamp: Date.now(),
        value: tx.value.toString()
      };
    } catch (error) {
      console.error('Error monitoring transaction:', error);
      throw new Error('Failed to monitor transaction');
    }
  }

  public async cancelTransaction(
    from: `0x${string}`,
    nonce: number,
    gasSettings: GasSettings
  ): Promise<string> {
    try {
      const transaction = await this.createTransaction({
        from,
        to: from,
        value: '0',
        nonce,
        maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
        maxFeePerGas: gasSettings.maxFeePerGas,
        gasLimit: gasSettings.gasLimit
      });

      transaction.nonce = nonce;
      return await this.sendTransaction(transaction);
    } catch (error) {
      console.error('Error canceling transaction:', error);
      throw new Error('Failed to cancel transaction');
    }
  }

  public async estimateGas(
    from: `0x${string}`,
    to: `0x${string}`,
    value: string
  ): Promise<string> {
    try {
      const gasEstimate = await this.publicClient.estimateGas({
        account: from,
        to,
        value: parseEther(value)
      });

      const gasLimit = gasEstimate * BigInt(11) / BigInt(10);
      return gasLimit.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  public async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.publicClient.getGasPrice();
      return formatEther(gasPrice);
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw new Error('Failed to get gas price');
    }
  }

  async getTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed' | null> {
    const tx = await this.publicClient.getTransaction({ hash: txHash as `0x${string}` });
    return tx ? 'confirmed' : null;
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    try {
      return await this.monitorTransaction(txHash as `0x${string}`);
    } catch (error) {
      return null;
    }
  }

  async getTransactionDetails(txHash: string): Promise<TransactionRequest | null> {
    const pendingTx = this.pendingTransactions.get(txHash);
    return pendingTx ? pendingTx.request : null;
  }

  public async getTransaction(hash: string): Promise<TransactionRequest | null> {
    const pendingTx = this.pendingTransactions.get(hash);
    return pendingTx ? pendingTx.request : null;
  }

  public getPendingTransactions(): TransactionRequest[] {
    return Array.from(this.pendingTransactions.values()).map(tx => tx.request);
  }

  public async getTransactionHistory(
    address: Address,
    limit: number = 10
  ): Promise<TransactionRequest[]> {
    try {
      const currentBlock = await this.publicClient.getBlockNumber();
      const transactions: TransactionRequest[] = [];
      let blockNumber = currentBlock;
      let processedBlocks = 0;
      const maxBlocksToProcess = 100; // Limit the number of blocks to process

      while (transactions.length < limit && 
             blockNumber > 0n && 
             processedBlocks < maxBlocksToProcess) {
        const block = await this.publicClient.getBlock({ blockNumber });
        if (!block) break;

        // Process transactions in parallel for better performance
        const txPromises = block.transactions.map(async (txHash) => {
          if (transactions.length >= limit) return null;
          
          const tx = await this.publicClient.getTransaction({ hash: txHash });
          if (!tx) return null;

          if (tx.from.toLowerCase() === address.toLowerCase() || 
              tx.to?.toLowerCase() === address.toLowerCase()) {
            return {
              from: tx.from,
              to: tx.to || '',
              value: tx.value.toString(),
              data: tx.input,
              nonce: Number(tx.nonce),
              gasLimit: tx.gas.toString(),
              maxFeePerGas: tx.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
              chainId: Number(tx.chainId)
            } as TransactionRequest;
          }
          return null;
        });

        const results = await Promise.all(txPromises);
        const validTransactions = results.filter((tx): tx is TransactionRequest => tx !== null);
        transactions.push(...validTransactions);

        blockNumber--;
        processedBlocks++;
      }

      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  destroy(): void {
    this.stopTransactionMonitoring();
  }
} 