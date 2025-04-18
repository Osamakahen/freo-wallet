import { ChainConfig } from '../config/ChainConfig';
import { WalletError } from '../error/ErrorHandler';
import { type TransactionRequest } from 'viem';

export class EVMChain {
  private config: ChainConfig;

  constructor(chainId: number) {
    this.config = {
      chainId,
      rpcUrl: '', // This will be set by the adapter
      name: '',
      symbol: '',
    };
  }

  getChainId(): number {
    return this.config.chainId;
  }

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    try {
      // This is a placeholder implementation
      // The actual implementation will be provided by the adapter
      console.log('Sending transaction:', tx);
      throw new Error('Not implemented');
    } catch (error) {
      throw new WalletError('Failed to send transaction', 'TRANSACTION_ERROR', { error });
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      // This is a placeholder implementation
      // The actual implementation will be provided by the adapter
      console.log('Getting receipt for transaction:', txHash);
      throw new Error('Not implemented');
    } catch (error) {
      throw new WalletError('Failed to get transaction receipt', 'RECEIPT_FETCH_ERROR', { error });
    }
  }
} 