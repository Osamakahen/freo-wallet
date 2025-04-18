import { DAppBridge } from './DAppBridge';
import { 
  TransactionRequest, 
  DAppInfo, 
  BridgeState,
  DAppResponse
} from '../../types/dapp';
import { EthereumEvent, EthereumCallback } from '../../types/ethereum';
import { WalletError } from '../error/ErrorHandler';

type EventListener = (data?: unknown) => void;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: EthereumEvent, callback: EthereumCallback) => void;
      removeListener: (event: EthereumEvent, callback: EthereumCallback) => void;
    };
  }
}

export class InjectedBridge {
  private bridge: DAppBridge;
  private listeners: Map<string, Set<EventListener>> = new Map();

  constructor(bridge: DAppBridge) {
    this.bridge = bridge;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.bridge.on('connect', () => this.emit('connect'));
    this.bridge.on('disconnect', () => this.emit('disconnect'));
    this.bridge.on('accountsChanged', (addresses: string[]) => this.emit('accountsChanged', addresses));
    this.bridge.on('chainChanged', (chainId: number) => this.emit('chainChanged', chainId));
    this.bridge.on('message', (message: string) => this.emit('message', message));
  }

  public async request(method: string, params?: unknown[]): Promise<DAppResponse> {
    switch (method) {
      case 'eth_requestAccounts':
        return { success: true, result: [this.bridge.getState().address] };
      case 'eth_accounts':
        return { success: true, result: [this.bridge.getState().address] };
      case 'eth_chainId':
        return { success: true, result: this.bridge.getState().chainId };
      case 'eth_sendTransaction':
        if (!params?.[0]) {
          throw new WalletError('Missing transaction parameters', 'INVALID_PARAMS');
        }
        return { success: true, result: await this.bridge.sendTransaction(params[0] as TransactionRequest) };
      case 'eth_sign':
        if (!params?.[0] || !params?.[1]) {
          throw new WalletError('Missing sign parameters', 'INVALID_PARAMS');
        }
        return { success: true, result: await this.bridge.signMessage(params[0] as string) };
      default:
        throw new WalletError('Unsupported method', 'UNSUPPORTED_METHOD');
    }
  }

  public on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  public removeListener(event: string, listener: EventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }

  public isConnected(): boolean {
    return this.bridge.getState().isConnected;
  }

  public getState(): BridgeState {
    return this.bridge.getState();
  }

  public getDAppInfo(): DAppInfo | null {
    return this.bridge.getDAppInfo();
  }
} 