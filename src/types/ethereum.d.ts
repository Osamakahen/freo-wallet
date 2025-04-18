export type EthereumEvent = 'chainChanged' | 'accountsChanged' | 'connect' | 'disconnect';

export type ChainChangedCallback = (chainId: string) => void;
export type AccountsChangedCallback = (accounts: string[]) => void;
export type ConnectCallback = (connectInfo: { chainId: string }) => void;
export type DisconnectCallback = (error: { code: number; message: string }) => void;

export type EthereumCallback = 
  | ChainChangedCallback 
  | AccountsChangedCallback 
  | ConnectCallback 
  | DisconnectCallback;

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