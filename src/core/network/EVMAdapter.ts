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
    const transaction = {
      chain: this.chain,
      account: preparedTx.from as `0x${string}`,
      to: preparedTx.to as `0x${string}`,
      value: BigInt(preparedTx.value),
      data: preparedTx.data as `0x${string}` | undefined,
      gas: preparedTx.gasLimit ? BigInt(preparedTx.gasLimit) : undefined,
      maxFeePerGas: preparedTx.gasPrice ? BigInt(preparedTx.gasPrice) : undefined,
      nonce: preparedTx.nonce
    };
    return this.walletClient.sendTransaction(transaction);
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