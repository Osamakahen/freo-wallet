import { DAppBridge } from './DAppBridge';
import { 
  TransactionRequest as DAppTransactionRequest, 
  DAppInfo, 
  BridgeState,
  DAppResponse
} from '../../types/dapp';
import { EthereumCallback, EthereumProvider } from '../../types/ethereum';
import { WalletError } from '../error/ErrorHandler';
import { TransactionRequest } from '../../types/wallet';

type EventListener = (data?: unknown) => void;

declare global {
  interface Window {
    ethereum?: EthereumProvider;
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

  private convertToWalletTransaction(dappTx: DAppTransactionRequest): TransactionRequest {
    return {
      from: this.bridge.getState().address as `0x${string}`,
      to: dappTx.to as `0x${string}`,
      value: dappTx.value || '0',
      data: dappTx.data,
      nonce: dappTx.nonce,
      maxFeePerGas: dappTx.maxFeePerGas,
      maxPriorityFeePerGas: dappTx.maxPriorityFeePerGas,
      gasLimit: dappTx.gasLimit
    };
  }

  public async request(method: string, params?: unknown[]): Promise<DAppResponse> {
    let walletTx: TransactionRequest | undefined;
    
    switch (method) {
      case 'eth_requestAccounts':
        return { result: [this.bridge.getState().address], id: Date.now() };
      case 'eth_accounts':
        return { result: [this.bridge.getState().address], id: Date.now() };
      case 'eth_chainId':
        return { result: this.bridge.getState().chainId, id: Date.now() };
      case 'eth_sendTransaction':
        if (!params?.[0]) {
          throw new WalletError('Missing transaction parameters', 'INVALID_PARAMS');
        }
        walletTx = this.convertToWalletTransaction(params[0] as DAppTransactionRequest);
        return { result: await this.bridge.sendTransaction(walletTx), id: Date.now() };
      case 'eth_sign':
        if (!params?.[0] || !params?.[1]) {
          throw new WalletError('Missing sign parameters', 'INVALID_PARAMS');
        }
        return { result: await this.bridge.signMessage(params[0] as string), id: Date.now() };
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