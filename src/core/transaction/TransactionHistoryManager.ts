import { createPublicClient, http, getContract, decodeFunctionData } from 'viem';
import { mainnet } from 'viem/chains';
import { ERC20_ABI } from '../token/abi/ERC20';
import { TransactionReceipt } from '../../types/wallet';
import { CategorizedTransaction } from './types';
import { Transaction } from '../../types/transaction';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { EventEmitter } from 'events';
import { WalletError } from '../error/ErrorHandler';

export class TransactionHistoryManager extends EventEmitter {
  private publicClient: ReturnType<typeof createPublicClient>;
  private address: string;
  private errorCorrelator: ErrorCorrelator;
  private transactions: Transaction[] = [];

  constructor(address: string) {
    super();
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });
    this.address = address;
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  async getTransactionHistory(
    address: `0x${string}`,
    options: {
      startBlock?: number;
      endBlock?: number;
      category?: 'send' | 'receive' | 'approval';
      tokenAddress?: `0x${string}`;
      limit?: number;
    } = {}
  ): Promise<CategorizedTransaction[]> {
    const {
      startBlock = 0,
      endBlock = await this.publicClient.getBlockNumber(),
      category,
      tokenAddress,
      limit = 100
    } = options;

    const transactions: CategorizedTransaction[] = [];
    let currentBlock = endBlock;

    while (currentBlock >= startBlock && transactions.length < limit) {
      const block = await this.publicClient.getBlock({
        blockNumber: BigInt(currentBlock),
        includeTransactions: true
      });

      for (const tx of block.transactions) {
        if (transactions.length >= limit) break;

        if (tx.to && tx.from) {
          const isFromUser = tx.from.toLowerCase() === address.toLowerCase();
          const isToUser = tx.to.toLowerCase() === address.toLowerCase();

          if (isFromUser || isToUser) {
            const receipt = await this.publicClient.getTransactionReceipt({
              hash: tx.hash
            });

            if (receipt) {
              const enhancedReceipt = {
                ...receipt,
                hash: tx.hash,
                timestamp: Date.now(),
                value: tx.value.toString(),
                blockNumber: Number(receipt.blockNumber),
                contractAddress: receipt.contractAddress ?? null,
                logs: receipt.logs.map(log => ({
                  ...log,
                  blockNumber: Number(log.blockNumber)
                })),
                gasUsed: receipt.gasUsed.toString(),
                effectiveGasPrice: receipt.effectiveGasPrice.toString(),
                cumulativeGasUsed: receipt.cumulativeGasUsed.toString()
              };
              const categorizedTx = await this.categorizeTransaction(tx, enhancedReceipt, address);
              if (
                (!category || categorizedTx.category === category) &&
                (!tokenAddress || categorizedTx.tokenAddress === tokenAddress)
              ) {
                transactions.push(categorizedTx);
              }
            }
          }
        }
      }

      currentBlock--;
    }

    return transactions;
  }

  private async categorizeTransaction(
    tx: any,
    receipt: TransactionReceipt,
    userAddress: `0x${string}`
  ): Promise<CategorizedTransaction> {
    const isFromUser = tx.from.toLowerCase() === userAddress.toLowerCase();
    const isToUser = tx.to?.toLowerCase() === userAddress.toLowerCase();

    // Convert viem receipt to our custom type
    const customReceipt: TransactionReceipt = {
      ...receipt,
      hash: tx.hash,
      timestamp: Date.now(),
      value: tx.value.toString(),
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString()
    };

    // Check if it's a token transfer
    if (tx.input && tx.input.startsWith('0xa9059cbb')) {
      const contract = getContract({
        address: tx.to!,
        abi: ERC20_ABI,
        client: this.publicClient
      });

      try {
        const result = decodeFunctionData({
          abi: ERC20_ABI,
          data: tx.input
        });
        const [to, value] = result.args as [`0x${string}`, bigint];
        const decimals = (await contract.read.decimals()) as number;
        const amount = Number(value) / parseInt('1' + '0'.repeat(decimals));
        const symbol = (await contract.read.symbol()) as string;

        return {
          hash: tx.hash,
          category: isFromUser ? 'send' : 'receive',
          from: tx.from,
          to: to,
          amount: isFromUser ? -amount : amount,
          tokenSymbol: symbol,
          tokenAddress: tx.to!,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString()
        };
      } catch {
        // Not a token transfer, continue to other checks
      }
    }

    // Check if it's a token approval
    if (tx.input && tx.input.startsWith('0x095ea7b3')) {
      const contract = getContract({
        address: tx.to!,
        abi: ERC20_ABI,
        client: this.publicClient
      });

      try {
        const result = decodeFunctionData({
          abi: ERC20_ABI,
          data: tx.input
        });
        const args = result.args as [`0x${string}`, bigint];
        const [spender, value] = args;
        const decimals = (await contract.read.decimals()) as number;
        const amount = Number(value) / parseInt('1' + '0'.repeat(decimals));

        return {
          hash: tx.hash,
          category: 'approval',
          from: tx.from,
          to: spender,
          amount,
          tokenSymbol: (await contract.read.symbol()) as string,
          tokenAddress: tx.to!,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          blockNumber: Number(receipt.blockNumber),
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString()
        };
      } catch {
        // Not a token approval, continue to other checks
      }
    }

    // Default to ETH transfer
    return {
      hash: tx.hash,
      category: isFromUser ? 'send' : 'receive',
      from: tx.from,
      to: tx.to!,
      amount: isFromUser ? -Number(tx.value) : Number(tx.value),
      tokenSymbol: 'ETH',
      tokenAddress: '0x0000000000000000000000000000000000000000' as const,
      status: receipt.status === 'success' ? 'success' : 'reverted',
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString()
    };
  }

  async exportTransactions(
    transactions: CategorizedTransaction[],
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(transactions, null, 2);
    }

    // CSV format
    const headers = [
      'Hash',
      'Category',
      'From',
      'To',
      'Amount',
      'Token',
      'Status',
      'Block',
      'Gas Used',
      'Gas Price'
    ];

    const rows = transactions.map((tx) => [
      tx.hash,
      tx.category,
      tx.from,
      tx.to,
      tx.amount.toString(),
      tx.tokenSymbol,
      tx.status,
      tx.blockNumber.toString(),
      tx.gasUsed,
      tx.effectiveGasPrice
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private async processTransaction(transaction: Transaction): Promise<void> {
    try {
      const from = transaction.from.toLowerCase();
      const to = transaction.to?.toLowerCase() ?? '';
      const address = this.address.toLowerCase();
      
      if (from === address) {
        await this.addOutgoingTransaction(transaction);
      } else if (to === address) {
        await this.addIncomingTransaction(transaction);
      }
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to process transaction', 'TRANSACTION_PROCESSING_ERROR', { error: error as Error })
      );
    }
  }

  async addTransaction(tx: Transaction): Promise<void> {
    try {
      const transaction = {
        ...tx,
        timestamp: Date.now(),
        status: 'pending'
      };

      this.transactions.push(transaction);
      await this.saveTransactions();
      this.emit('transactionAdded', transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  private async addOutgoingTransaction(transaction: Transaction): Promise<void> {
    // Implementation for outgoing transactions
  }

  private async addIncomingTransaction(transaction: Transaction): Promise<void> {
    // Implementation for incoming transactions
  }

  private async saveTransactions(): Promise<void> {
    // Implementation for saving transactions
  }
} 