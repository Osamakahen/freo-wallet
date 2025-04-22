import { ethers } from 'ethers';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { WalletError } from '../error/ErrorHandler';

export class WalletManager {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;
  private signer: ethers.HDNodeWallet | ethers.JsonRpcSigner | null = null;
  private errorCorrelator: ErrorCorrelator;
  private isConnected: boolean = false;
  private isDevMode: boolean;
  private devModeWallet: ethers.HDNodeWallet | null = null;

  constructor(devMode: boolean = false) {
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.isDevMode = devMode;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isDevMode) {
        // Development mode: Use Infura provider
        const infuraUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
        if (!infuraUrl) {
          throw new WalletError('Infura URL not configured', 'INFURA_ERROR');
        }
        
        this.provider = new ethers.JsonRpcProvider(infuraUrl);
        
        // Create a random wallet for testing if not already created
        if (!this.devModeWallet) {
          this.devModeWallet = ethers.Wallet.createRandom();
        }
        
        // Connect the wallet to the provider
        if (this.provider && this.devModeWallet) {
          this.signer = this.devModeWallet.connect(this.provider) as ethers.HDNodeWallet;
          this.isConnected = true;
        }
        return;
      }

      // Production mode: Use browser wallet
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new WalletError('No Ethereum provider found', 'PROVIDER_ERROR');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.isConnected = true;
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async getAddress(): Promise<string> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'CONNECTION_ERROR');
      }
      return await this.signer.getAddress();
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new WalletError('Wallet not connected', 'CONNECTION_ERROR');
    }
    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'SIGNATURE_ERROR'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'CONNECTION_ERROR');
      }
      return await this.signer.sendTransaction(transaction);
    } catch (error: unknown) {
      const walletError = error instanceof WalletError ? error : new WalletError(
        error instanceof Error ? error.message : 'Unknown error',
        'TRANSACTION_ERROR'
      );
      throw this.errorCorrelator.correlateError(walletError);
    }
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.isConnected = false;
  }

  getState() {
    return {
      isInitialized: true,
      isConnected: this.isConnected,
      address: this.signer ? this.getAddress() : null,
      balance: '0',
      network: 'mainnet',
      chainId: 1
    };
  }
} 