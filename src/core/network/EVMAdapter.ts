import { createPublicClient, http, Chain, mainnet } from 'viem';
import { TransactionRequest, TransactionReceipt } from '../types/transaction';

export class EVMAdapter {
  private client: ReturnType<typeof createPublicClient>;
  private chain: Chain;

  constructor(chain: Chain = mainnet) {
    this.chain = chain;
    this.client = createPublicClient({
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
    const { hash } = await this.client.sendTransaction({
      account: preparedTx.from,
      to: preparedTx.to,
      value: BigInt(preparedTx.value),
      gasPrice: preparedTx.gasPrice ? BigInt(preparedTx.gasPrice) : undefined,
      gas: preparedTx.gasLimit ? BigInt(preparedTx.gasLimit) : undefined,
      data: preparedTx.data as `0x${string}`,
      chain: this.chain
    });
    return hash;
  }

  async getNonce(address: string): Promise<number> {
    return Number(await this.client.getTransactionCount({
      address: address as `0x${string}`
    }));
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.client.getBalance({
      address: address as `0x${string}`
    });
    return balance.toString();
  }

  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    return this.client.getTransactionReceipt({
      hash: hash as `0x${string}`
    });
  }

  async getTransactionStatus(hash: string): Promise<'pending' | 'success' | 'reverted'> {
    const receipt = await this.getTransactionReceipt(hash);
    if (!receipt) return 'pending';
    return receipt.status === 'success' ? 'success' : 'reverted';
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.client.getGasPrice();
    return gasPrice.toString();
  }

  async estimateGas(tx: TransactionRequest): Promise<string> {
    // Implementation
    return '0';
  }
} 