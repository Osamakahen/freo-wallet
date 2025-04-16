import { ethers } from 'ethers';
import { WalletConfig, TransactionRequest } from '../../types/wallet';

export class EVMAdapter {
  readonly chainId: number;
  private provider: ethers.JsonRpcProvider;

  constructor(config: WalletConfig) {
    this.chainId = config.chainId;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return balance.toString();
  }

  async prepareTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    const nonce = await this.provider.getTransactionCount(tx.from || '');
    const gasLimit = tx.gasLimit || (await this.provider.estimateGas(tx)).toString();
    const feeData = await this.provider.getFeeData();

    return {
      ...tx,
      nonce,
      gasLimit,
      maxFeePerGas: tx.maxFeePerGas || feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas?.toString()
    };
  }

  async broadcastTransaction(signedTx: string): Promise<string> {
    const tx = await this.provider.broadcastTransaction(signedTx);
    return tx.hash;
  }

  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice?.toString() || '0';
  }

  async estimateGas(tx: TransactionRequest): Promise<string> {
    const gas = await this.provider.estimateGas(tx);
    return gas.toString();
  }

  async getNonce(address: string): Promise<number> {
    return this.provider.getTransactionCount(address);
  }
} 