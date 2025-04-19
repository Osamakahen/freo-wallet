export type EthereumEvent = 'accountsChanged' | 'chainChanged' | 'disconnect';
export type EthereumCallback = (params: any) => void;

export interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: EthereumEvent, handler: EthereumCallback) => void;
  removeListener: (event: EthereumEvent, handler: EthereumCallback) => void;
  isMetaMask?: boolean;
  selectedAddress?: string;
  chainId?: string;
} 