import React, { useState } from 'react';
import { EVMAdapter } from '../core/evm/EVMAdapter';
import { mainnet, goerli, sepolia } from 'viem/chains';

interface NetworkSwitcherProps {
  evmAdapter: EVMAdapter;
}

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({ evmAdapter }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const networks = [
    { id: mainnet.id, name: 'Ethereum Mainnet' },
    { id: goerli.id, name: 'Goerli Testnet' },
    { id: sepolia.id, name: 'Sepolia Testnet' }
  ];

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await evmAdapter.switchChain(chainId);
      setSuccess(`Switched to ${networks.find(n => n.id === chainId)?.name}`);
    } catch (err) {
      setError('Failed to switch network');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Network Switcher</h2>
      
      {loading && <div className="text-blue-500">Switching network...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}

      <div className="space-y-2">
        {networks.map((network) => (
          <button
            key={network.id}
            onClick={() => handleSwitchNetwork(network.id)}
            disabled={loading}
            className="w-full px-4 py-2 text-left border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {network.name}
          </button>
        ))}
      </div>
    </div>
  );
}; 