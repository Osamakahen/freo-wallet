export type EthereumEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';
export type EthereumCallback = (params?: unknown) => void;

export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (params: any) => void) => void;
  removeListener: (eventName: string, handler: (params: any) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 