import { createPublicClient, createWalletClient, http, Chain } from 'viem';
import { mainnet } from 'viem/chains';
import { TransactionRequest, TransactionReceipt } from '../types/transaction';

export class EVMAdapter {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private chain: Chain;

  constructor(chain: Chain = mainnet) {
    this.chain = chain;
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http()
    });
    this.walletClient = createWalletClient({
      chain: this.chain,
      transport: http()
    });
  }

  async prepareTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    const gasPrice = await this.getGasPrice();
    const gasLimit = tx.gasLimit || '21000';
    
    return {
      ...tx,
      gasPrice,
      gasLimit
    };
  }

  async sendTransaction(tx: TransactionRequest): Promise<string> {
    const preparedTx = await this.prepareTransaction(tx);
    return this.walletClient.sendTransaction({
      account: preparedTx.from,
      to: preparedTx.to,
      value: BigInt(preparedTx.value),
      data: preparedTx.data as `0x${string}`
    });
  }

  async getNonce(address: string): Promise<number> {
    return Number(await this.publicClient.getTransactionCount({
      address: address as `0x${string}`
    }));
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.publicClient.getBalance({
      address: address as `0x${string}`
    });
    return balance.toString();
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    return this.publicClient.getTransactionReceipt({
      hash: hash as `0x${string}`
    });
  }

  async getTransactionStatus(hash: string): Promise<'pending' | 'success' | 'reverted'> {
    const receipt = await this.getTransactionReceipt(hash);
    if (!receipt) return 'pending';
    return receipt.status === 'success' ? 'success' : 'reverted';
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.publicClient.getGasPrice();
    return gasPrice.toString();
  }

  async estimateGas(tx: TransactionRequest): Promise<string> {
    // Implementation
    return '0';
  }
} 