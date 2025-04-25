import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

export const useWalletConnection = () => {
  const { account, connected, connect, disconnect } = useWallet();
  const { chainId, networkName, symbol, rpcUrl, explorer } = useNetwork();

  return {
    address: account,
    isConnected: connected,
    connect,
    disconnect,
    chainId,
    networkName,
    symbol,
    rpcUrl,
    explorer
  };
}; 