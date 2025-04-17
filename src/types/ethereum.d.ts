export type EthereumEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';
export type EthereumCallback = (params?: unknown) => void;

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, handler: (params: unknown) => void) => void;
  removeListener: (eventName: string, handler: (params: unknown) => void) => void;
  isMetaMask?: boolean;
  chainId?: string;
  selectedAddress?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 