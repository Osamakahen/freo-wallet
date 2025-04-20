import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

export const useWalletConnection = () => {
  const { address, isConnected, connect, disconnect } = useWallet();
  const { chainId, networkName, symbol, rpcUrl, explorer } = useNetwork();

  return {
    address,
    isConnected,
    connect,
    disconnect,
    chainId,
    networkName,
    symbol,
    rpcUrl,
    explorer
  };
}; 