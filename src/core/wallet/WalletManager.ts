import { ethers } from 'ethers';
import { ErrorCorrelator } from './ErrorCorrelator';
import { WalletError } from '../error/WalletError';

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private errorCorrelator: ErrorCorrelator;
  private isConnected: boolean = false;

  constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  async connect(): Promise<void> {
    try {
      if (!window.ethereum) {
        throw new WalletError('No Ethereum provider found', 'wallet', 'high');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.isConnected = true;
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(error instanceof Error ? error.message : 'Unknown error', 'wallet', 'high');
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async getAddress(): Promise<string> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'wallet', 'high');
      }
      return await this.signer.getAddress();
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(error instanceof Error ? error.message : 'Unknown error', 'wallet', 'high');
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      const correlatedError = this.errorCorrelator.correlateError(error);
      throw correlatedError;
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'wallet', 'high');
      }
      return await this.signer.sendTransaction(transaction);
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(error instanceof Error ? error.message : 'Unknown error', 'wallet', 'high');
      throw this.errorCorrelator.correlateError(walletError);
    }
  }
} 