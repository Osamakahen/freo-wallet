import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

export const useWalletConnection = () => {
  const { address, isConnected, connect, disconnect } = useWallet();
  const { network } = useNetwork();

  return {
    address,
    isConnected,
    connect,
    disconnect,
    network
  };
}; 