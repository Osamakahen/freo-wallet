import { EIP1193Provider, EIP1193EventMap } from 'viem';

export type EthereumEvent = 
  | 'accountsChanged'
  | 'chainChanged'
  | 'connect'
  | 'disconnect'
  | 'message';

export type EthereumCallback = (...args: any[]) => void;

export type EthereumRequestParams = {
  method: 'eth_requestAccounts';
  params?: never;
} | {
  method: 'eth_chainId';
  params?: never;
} | {
  method: 'eth_getBalance';
  params: [address: string, block?: string];
} | {
  method: 'wallet_switchEthereumChain';
  params: [{ chainId: string }];
} | {
  method: 'wallet_addEthereumChain';
  params: [{
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  }];
} | {
  method: string;
  params?: unknown[];
};

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
  request: {
    (args: { method: 'eth_requestAccounts' }): Promise<string[]>;
    (args: { method: 'eth_chainId' }): Promise<string>;
    (args: { method: 'eth_getBalance'; params: [string, string] }): Promise<string>;
    (args: { method: string; params?: unknown[] }): Promise<unknown>;
  };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 