import { SessionManager } from '../session/SessionManager'
import { TransactionManager } from '../transaction/TransactionManager'
import { 
  DAppInfo, 
  BridgeState, 
  BridgeEvents, 
  BridgeConfig,
  DAppResponse,
  Permission
} from '../../types/dapp'
import { TransactionRequest } from '../../types/wallet'
import { WalletError, DAppError, TransactionError } from '../error/ErrorHandler'
import { type Address } from 'viem'

export class DAppBridge {
  private static instance: DAppBridge | null = null;
  private sessionManager: SessionManager;
  private transactionManager: TransactionManager;
  private config: BridgeConfig;
  private state: BridgeState;
  private events: BridgeEvents;
  private dAppInfo: DAppInfo | null = null;
  private connectedAccount: string | null = null;
  private isConnected: boolean = false;

  constructor(
    sessionManager: SessionManager,
    transactionManager: TransactionManager,
    config: BridgeConfig
  ) {
    this.sessionManager = sessionManager;
    this.transactionManager = transactionManager;
    this.config = {
      autoConnect: true,
      sessionTimeout: 3600000, // 1 hour
      maxConnections: 5,
      requireConfirmation: true,
      rpcUrl: config.rpcUrl || '',
      qrcodeModal: config.qrcodeModal,
      defaultChain: config.defaultChain
    };

    this.state = {
      isConnected: false,
      address: null,
      chainId: null,
      permissions: null,
      error: null
    };

    this.events = {
      connect: () => {},
      disconnect: () => {},
      accountsChanged: () => {},
      chainChanged: () => {},
      message: () => {}
    };
  }

  static getInstance(
    sessionManager: SessionManager,
    transactionManager: TransactionManager,
    config: BridgeConfig
  ): DAppBridge {
    if (!DAppBridge.instance) {
      DAppBridge.instance = new DAppBridge(sessionManager, transactionManager, config);
    }
    return DAppBridge.instance;
  }

  public async initialize(dAppInfo: DAppInfo): Promise<void> {
    try {
      this.dAppInfo = dAppInfo
      
      if (this.config.autoConnect) {
        await this.connect()
      }
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to initialize'
      throw error
    }
  }

  public async connect(): Promise<void> {
    try {
      const session = await this.sessionManager.getActiveSession()
      if (!session) {
        throw new Error('No active session found')
      }

      this.state = {
        ...this.state,
        isConnected: true,
        address: session.address,
        chainId: session.chainId,
        permissions: {
          read: true,
          write: true,
          sign: true,
          nft: true
        },
        error: null
      }

      this.connectedAccount = session.address
      this.events.connect()
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to connect'
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.dAppInfo) {
        throw new Error('DApp not initialized')
      }
      await this.sessionManager.revokeSession(this.dAppInfo.origin)
      this.state = {
        ...this.state,
        isConnected: false,
        address: null,
        chainId: null,
        permissions: null,
        error: null
      }
      this.connectedAccount = null
      this.events.disconnect()
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to disconnect'
      throw error
    }
  }

  public async requestAccounts(): Promise<string[]> {
    if (!this.isConnected) {
      throw new WalletError('Not connected to DApp')
    }
    return this.connectedAccount ? [this.connectedAccount] : []
  }

  public async requestPermissions(permissions: Permission[]): Promise<Permission[]> {
    try {
      if (!this.dAppInfo) {
        throw new Error('DApp not initialized')
      }

      // Mock implementation - in a real implementation, this would interact with the session manager
      const granted: Permission[] = permissions.map(p => ({
        type: p.type,
        description: p.description
      }))

      this.state.permissions = {
        read: granted.some(p => p.type === 'read'),
        write: granted.some(p => p.type === 'write'),
        sign: granted.some(p => p.type === 'message-sign'),
        nft: granted.some(p => p.type === 'nft-access')
      }

      return granted
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to request permissions'
      throw error
    }
  }

  public async sendTransaction(transaction: TransactionRequest): Promise<DAppResponse> {
    if (!this.isConnected) {
      throw new DAppError('Wallet is not connected', {
        error: new Error('Wallet is not connected'),
        method: 'sendTransaction',
        connectionStatus: false
      });
    }

    try {
      const txHash = await this.transactionManager.sendTransaction(transaction)
      return {
        result: txHash,
        id: Date.now()
      }
    } catch (error) {
      throw new TransactionError(
        error instanceof Error ? error.message : 'Failed to send transaction',
        {
          method: 'sendTransaction',
          transaction,
          originalError: error
        }
      )
    }
  }

  public async signMessage(message: string): Promise<string> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Not connected')
      }

      if (!this.state.permissions?.sign) {
        throw new Error('No sign permissions')
      }

      return this.transactionManager.signMessage(message)
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to sign message'
      throw error
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Not connected')
      }

      // Mock implementation - in a real implementation, this would interact with the session manager
      this.state.chainId = chainId
      this.events.chainChanged(chainId)
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to switch chain'
      throw error
    }
  }

  public on<T extends keyof BridgeEvents>(event: T, callback: BridgeEvents[T]): void {
    this.events[event] = callback
  }

  public getState(): BridgeState {
    return { ...this.state }
  }

  public getDAppInfo(): DAppInfo | null {
    return this.dAppInfo
  }
} 