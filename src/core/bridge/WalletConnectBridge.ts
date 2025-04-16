import { WalletConnect } from '@walletconnect/client';
import { BridgeConfig, TransactionRequest } from '../../types/dapp';
import { WalletError } from '../error/ErrorHandler';

export class WalletConnectBridge {
  private connector: WalletConnect;
  private config: BridgeConfig;
  private connectedAccount: string | null = null;
  private isConnected: boolean = false;

  constructor(config: BridgeConfig) {
    this.config = config;
    this.connector = new WalletConnect({
      bridge: config.rpcUrl,
      qrcodeModal: config.qrcodeModal
    });
  }

  async connect(): Promise<void> {
    try {
      this.isConnected = true;
      this.connectedAccount = '0x123...'; // Mock implementation
    } catch (error) {
      throw new WalletError('Failed to connect to wallet');
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.connectedAccount = null;
  }

  async requestAccounts(): Promise<string[]> {
    if (!this.isConnected) {
      throw new WalletError('Not connected to wallet');
    }
    if (!this.connectedAccount) {
      throw new WalletError('No account connected');
    }
    return [this.connectedAccount];
  }

  async signTransaction(request: TransactionRequest): Promise<string> {
    try {
      const result = await this.connector.signTransaction(request);
      return result as string;
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      const result = await this.connector.signMessage(message);
      return result as string;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 