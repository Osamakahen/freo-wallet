import { EIP1193Provider, EIP1193EventMap, EIP1193RequestFn } from 'viem';

export type EthereumEvent = 
  | 'accountsChanged'
  | 'chainChanged'
  | 'connect'
  | 'disconnect'
  | 'message';

export type EthereumCallback = (...args: any[]) => void;

export interface EthereumProvider extends EIP1193Provider {
  isMetaMask?: boolean;
  chainId?: string;
  selectedAddress?: string;
  on: <event extends keyof EIP1193EventMap | EthereumEvent>(
    event: event,
    listener: event extends keyof EIP1193EventMap ? EIP1193EventMap[event] : EthereumCallback
  ) => void;
  removeListener: <event extends keyof EIP1193EventMap | EthereumEvent>(
    event: event,
    listener: event extends keyof EIP1193EventMap ? EIP1193EventMap[event] : EthereumCallback
  ) => void;
  request: EIP1193RequestFn;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 