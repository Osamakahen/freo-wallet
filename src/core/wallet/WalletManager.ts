import { ethers } from 'ethers';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { WalletError } from '../error/ErrorHandler';

export class WalletManager {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private errorCorrelator: ErrorCorrelator;
  private isConnected: boolean = false;
  private isDevMode: boolean;

  constructor(devMode: boolean = false) {
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.isDevMode = devMode;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isDevMode) {
        // Development mode: Use Infura provider
        const infuraUrl = process.env.NEXT_PUBLIC_INFURA_URL;
        if (!infuraUrl) {
          throw new WalletError('Infura URL not configured', 'INFURA_ERROR', { error: new Error('Infura URL not configured') }, 'high');
        }
        this.provider = new ethers.JsonRpcProvider(infuraUrl);
        // Create a random wallet for testing
        const wallet = ethers.Wallet.createRandom();
        this.signer = (wallet.connect(this.provider) as unknown) as ethers.JsonRpcSigner;
        this.isConnected = true;
        return;
      }

      // Production mode: Use browser wallet
      if (!window.ethereum) {
        throw new WalletError('No Ethereum provider found', 'PROVIDER_ERROR', { error: new Error('No Ethereum provider found') }, 'high');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.isConnected = true;
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        { error: error instanceof Error ? error : new Error('Unknown error') },
        'high'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async getAddress(): Promise<string> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'CONNECTION_ERROR', { error: new Error('Wallet not connected') }, 'high');
      }
      return await this.signer.getAddress();
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        { error: error instanceof Error ? error : new Error('Unknown error') },
        'high'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new WalletError('Wallet not connected', 'CONNECTION_ERROR', { error: new Error('Wallet not connected') }, 'high');
    }
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'SIGNATURE_ERROR',
        { error: error instanceof Error ? error : new Error('Unknown error') },
        'high'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'CONNECTION_ERROR', { error: new Error('Wallet not connected') }, 'high');
      }
      return await this.signer.sendTransaction(transaction);
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'TRANSACTION_ERROR',
        { error: error instanceof Error ? error : new Error('Unknown error') },
        'high'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }
} 