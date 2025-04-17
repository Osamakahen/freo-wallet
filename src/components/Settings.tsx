import React from 'react';
import { useDApp } from '../contexts/DAppContext';
import { useNetwork } from '../contexts/NetworkContext';

export const Settings: React.FC = () => {
  const { currentAccount } = useDApp();
  const { network, switchNetwork } = useNetwork();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Network</h3>
        <p className="text-sm text-gray-600">
          Current Network: {network.networkName} (Chain ID: {network.chainId})
        </p>
        <div className="mt-2 space-y-2">
          <button
            onClick={() => switchNetwork(1)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Switch to Ethereum Mainnet
          </button>
          <button
            onClick={() => switchNetwork(5)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Switch to Goerli Testnet
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Account</h3>
        <p className="text-sm text-gray-600">
          Connected Address: {currentAccount || 'Not connected'}
        </p>
      </div>
    </div>
  );
}; 