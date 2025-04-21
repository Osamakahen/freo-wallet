import { ethers } from 'ethers';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { WalletError } from '../error/ErrorHandler';

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private errorCorrelator: ErrorCorrelator;

  constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  async connect(): Promise<void> {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    } catch (error) {
      const walletError = error instanceof Error ? new WalletError(error.message) : new WalletError('Unknown error');
      const correlatedError = this.errorCorrelator.correlateError(walletError);
      throw correlatedError;
    }
  }

  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    try {
      return await this.signer.getAddress();
    } catch (error) {
      const walletError = error instanceof Error ? new WalletError(error.message) : new WalletError('Unknown error');
      const correlatedError = this.errorCorrelator.correlateError(walletError);
      throw correlatedError;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      const walletError = error instanceof Error ? new WalletError(error.message) : new WalletError('Unknown error');
      const correlatedError = this.errorCorrelator.correlateError(walletError);
      throw correlatedError;
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    try {
      return await this.signer.sendTransaction(transaction);
    } catch (error) {
      const walletError = error instanceof Error ? new WalletError(error.message) : new WalletError('Unknown error');
      const correlatedError = this.errorCorrelator.correlateError(walletError);
      throw correlatedError;
    }
  }
} 