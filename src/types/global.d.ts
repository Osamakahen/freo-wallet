import { ExternalProvider } from '@ethersproject/providers';

interface EthereumProvider extends ExternalProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string | symbol, listener: (...args: any[]) => void) => void;
  removeListener: (eventName: string | symbol, listener: (...args: any[]) => void) => void;
}

interface Window {
  ethereum?: EthereumProvider;
} 