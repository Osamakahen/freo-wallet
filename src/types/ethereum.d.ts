import { EIP1193Provider } from 'viem';

export interface EthereumProvider extends EIP1193Provider {
  isMetaMask?: boolean;
  chainId?: string;
  selectedAddress?: string;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 