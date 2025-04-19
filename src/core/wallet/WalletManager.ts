import { ethers } from 'ethers';
import { EthereumProvider } from '../../types/ethereum';
import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';

export interface WalletState {
  address: string | null;
  balance: string;
  isConnected: boolean;
  chainId: string | null;
}

export class WalletManager {
  private static instance: WalletManager | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private errorCorrelator: ErrorCorrelator;

  constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  async connect(): Promise<WalletState> {
    try {
      if (!window.ethereum) {
        throw new WalletError('Ethereum provider not found', 'PROVIDER_NOT_FOUND');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum as EthereumProvider);
      this.signer = await this.provider.getSigner();
      
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        isConnected: true,
        chainId: network.chainId.toString()
      };
    } catch (error: unknown) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to connect wallet', 'WALLET_CONNECTION_ERROR', { error: error as Error })
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.provider = null;
      this.signer = null;
    } catch (error: unknown) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to disconnect wallet', 'WALLET_DISCONNECTION_ERROR', { error: error as Error })
      );
      throw error;
    }
  }

  async getState(): Promise<WalletState> {
    try {
      if (!this.provider || !this.signer) {
        return {
          address: null,
          balance: '0',
          isConnected: false,
          chainId: null
        };
      }

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        isConnected: true,
        chainId: network.chainId.toString()
      };
    } catch (error: unknown) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to get wallet state', 'WALLET_STATE_ERROR', { error: error as Error })
      );
      throw error;
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }
      return await this.signer.signMessage(message);
    } catch (error: unknown) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to sign message', 'MESSAGE_SIGNING_ERROR', { error: error as Error })
      );
      throw error;
    }
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    try {
      if (!this.signer) {
        throw new WalletError('Wallet not connected', 'WALLET_NOT_CONNECTED');
      }
      return await this.signer.sendTransaction(transaction);
    } catch (error: unknown) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to send transaction', 'TRANSACTION_ERROR', { error: error as Error })
      );
      throw error;
    }
  }
} 