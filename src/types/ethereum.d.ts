export type EthereumEvent = 'chainChanged' | 'accountsChanged' | 'connect' | 'disconnect';
export type EthereumCallback = (params?: unknown) => void;

export interface EthereumProvider {
  isMetaMask?: boolean;
  chainId: string;
  selectedAddress: string | null;
  networkVersion: string;
  isConnected(): boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: EthereumEvent, callback: EthereumCallback): void;
  removeListener(event: EthereumEvent, callback: EthereumCallback): void;
  removeAllListeners(event?: EthereumEvent): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 