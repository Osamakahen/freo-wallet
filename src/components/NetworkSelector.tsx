import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'react-toastify';

const NETWORKS = [
  { id: '0x1', name: 'Ethereum Mainnet' },
  { id: '0x5', name: 'Goerli Testnet' },
  { id: '0xaa36a7', name: 'Sepolia Testnet' },
  { id: '0x89', name: 'Polygon Mainnet' },
  { id: '0x13881', name: 'Mumbai Testnet' },
];

export const NetworkSelector: React.FC = () => {
  const { chainId, ethereum, setChainId } = useWallet();

  const switchNetwork = async (targetChainId: string) => {
    if (!ethereum) {
      toast.error('No Ethereum provider found');
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      setChainId(targetChainId);
      toast.success('Network switched successfully');
    } catch (error) {
      const err = error as { code: number };
      if (err.code === 4902) {
        toast.error('Network not configured in wallet');
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  return (
    <div className="relative">
      <select
        value={chainId || ''}
        onChange={(e) => switchNetwork(e.target.value)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          Select Network
        </option>
        {NETWORKS.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
    </div>
  );
}; 