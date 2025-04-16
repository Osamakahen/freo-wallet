import { createPublicClient, http, PublicClient, WalletClient, createWalletClient, custom } from 'viem';
import { SDKConfig, Session, Event, EventHandler, SDKError } from './types';
import { SessionManager } from '../core/session/SessionManager';
import { ErrorCorrelator } from '../core/error/ErrorCorrelator';
import { WalletError } from '../core/errors/WalletErrors';

export class FreoWalletSDK {
  private config: SDKConfig;
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private session?: Session;
  private eventHandlers: Map<string, EventHandler[]>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private sessionManager: SessionManager;
  private errorCorrelator: ErrorCorrelator;

  constructor(config: SDKConfig) {
    this.config = config;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.sessionManager = new SessionManager();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http()
    });

    if (config.autoConnect) {
      this.connect();
    }
  }

  async connect(): Promise<Session> {
    try {
      // Check if wallet is available
      if (!window.ethereum) {
        throw new SDKError('Wallet not found', 'WALLET_NOT_FOUND');
      }

      // Initialize wallet client
      this.walletClient = createWalletClient({
        chain: this.publicClient.chain,
        transport: custom(window.ethereum),
      });

      // Request account access
      const [address] = await this.walletClient.requestAddresses();

      // Create session
      const response = await fetch(`${this.config.apiUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chainId: this.config.chainId,
        }),
      });

      if (!response.ok) {
        throw new SDKError('Failed to create session', 'SESSION_ERROR');
      }

      this.session = await response.json();
      this.reconnectAttempts = 0;

      // Start event listeners
      this.setupEventListeners();

      return this.session;
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        return this.connect();
      }
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.walletClient) return;

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.handleEvent('accountsChanged', { accounts });
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId: string) => {
      this.handleEvent('chainChanged', { chainId });
    });

    // Listen for disconnect
    window.ethereum.on('disconnect', (error: any) => {
      this.handleEvent('disconnect', { error });
    });
  }

  async signTransaction(transaction: any): Promise<string> {
    if (!this.walletClient || !this.session) {
      throw new SDKError('Not connected', 'NOT_CONNECTED');
    }

    try {
      // Verify transaction
      const response = await fetch(`${this.config.apiUrl}/transactions/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.session.id}`,
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new SDKError('Transaction verification failed', 'VERIFICATION_ERROR');
      }

      // Sign transaction
      const signedTx = await this.walletClient.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      this.handleEvent('transactionError', { error });
      throw error;
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleEvent(type: string, data: any) {
    const event: Event = {
      type,
      data,
      timestamp: Date.now(),
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  async disconnect() {
    if (this.session) {
      await fetch(`${this.config.apiUrl}/sessions/${this.session.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.session.id}`,
        },
      });
    }

    this.session = undefined;
    this.walletClient = undefined;
    this.eventHandlers.clear();
  }

  getSession(): Session | undefined {
    return this.session;
  }

  private async handleError(error: Error): Promise<void> {
    const walletError = new WalletError(error.message);
    await this.errorCorrelator.correlateError(walletError);
    throw error;
  }
} 