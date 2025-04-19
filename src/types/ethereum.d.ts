import { EIP1193Provider, EIP1193EventMap, EIP1193RequestFn } from 'viem';

export interface EthereumProvider extends EIP1193Provider {
  isMetaMask?: boolean;
  chainId?: string;
  selectedAddress?: string;
  on: <event extends keyof EIP1193EventMap>(event: event, listener: EIP1193EventMap[event]) => void;
  removeListener: <event extends keyof EIP1193EventMap>(event: event, listener: EIP1193EventMap[event]) => void;
  request: EIP1193RequestFn;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 