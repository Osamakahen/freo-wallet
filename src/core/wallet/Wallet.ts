import { createWalletClient, custom, getAddress, formatEther } from 'viem';
import { mainnet } from 'viem/chains';
import { KeyManager } from '../keyManagement/KeyManager';
import { TransactionManager } from '../transaction/TransactionManager';
import { NetworkManager } from '../network/NetworkManager';
import { DAppManager } from '../dapp/DAppManager';
import { WalletConfig, WalletState } from '../../types/wallet';
import { SessionManager } from '../session/SessionManager';
import { TokenManager } from '../token/TokenManager';
import { TokenBalance, TransactionReceipt } from '../../types/token';

export class Wallet {
  private keyManager: KeyManager;
  private transactionManager: TransactionManager;
  private networkManager: NetworkManager;
  private dappManager: DAppManager;
  private sessionManager: SessionManager;
  private tokenManager: TokenManager;
  private state: WalletState;
  private client: ReturnType<typeof createWalletClient>;

  constructor(config: WalletConfig) {
    this.keyManager = new KeyManager();
    this.networkManager = new NetworkManager(config);
    this.sessionManager = new SessionManager();
    this.transactionManager = new TransactionManager(
      this.networkManager.getAdapter(),
      this.keyManager
    );
    this.dappManager = new DAppManager(
      this.sessionManager,
      this.keyManager,
      this.networkManager.getAdapter()
    );
    this.tokenManager = new TokenManager(this.networkManager.getAdapter());
    
    // Initialize state with proper types
    this.state = {
      isInitialized: false,
      isConnected: false,
      address: null,
      balance: '0',
      network: config.networkName
    };
    
    // Initialize viem client with proper error handling
    if (typeof window !== 'undefined' && window.ethereum) {
      this.client = createWalletClient({
        chain: mainnet,
        transport: custom(window.ethereum)
      });
    } else {
      throw new Error('Ethereum provider not found');
    }
  }

  async initialize(password: string, mnemonic?: string): Promise<void> {
    try {
      await this.keyManager.setup(password, mnemonic);
      const address = await this.keyManager.getAddress();
      this.state.isInitialized = true;
      this.state.address = getAddress(address);
    } catch (error) {
      throw new Error(`Failed to initialize wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async connect(): Promise<void> {
    if (!this.state.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    try {
      await this.networkManager.connect();
      await this.updateBalance();
      this.state.isConnected = true;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    this.state.isConnected = false;
    this.state.balance = '0';
  }

  async sendTransaction(tx: any): Promise<string> {
    if (!this.state.isConnected) {
      throw new Error('Wallet not connected');
    }
    try {
      const hash = await this.transactionManager.sendTransaction(tx);
      await this.updateBalance();
      return hash;
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateBalance(): Promise<void> {
    if (!this.state.address || this.state.address === '0x') return;
    
    try {
      const balance = await this.client.getBalance({
        address: this.state.address
      });
      this.state.balance = formatEther(balance);
    } catch (error) {
      console.error('Failed to update balance:', error);
      this.state.balance = '0';
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  public async getTokenList(): Promise<`0x${string}`[]> {
    if (!this.state.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.tokenManager.getTokenList();
  }

  public async getTokenBalance(tokenAddress: `0x${string}`, ownerAddress: `0x${string}`): Promise<TokenBalance> {
    if (!this.state.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.tokenManager.getTokenBalance(tokenAddress, ownerAddress);
  }

  public async getTokenTransferData(tokenAddress: `0x${string}`, to: `0x${string}`, amount: string): Promise<`0x${string}`> {
    if (!this.state.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.tokenManager.getTransferData(tokenAddress, to, amount);
  }

  public async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
    if (!this.state.isConnected) {
      throw new Error('Wallet not connected');
    }
    return this.transactionManager.getTransactionReceipt(hash);
  }
} 