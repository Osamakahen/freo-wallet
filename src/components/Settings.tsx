import React, { useState } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { useGas } from '../contexts/GasContext';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'react-toastify';

export const Settings: React.FC = () => {
  const { chainId, switchNetwork } = useNetwork();
  const { gasPrices, updateGasSettings } = useGas();
  const { account } = useWallet();
  const [customGasSettings, setCustomGasSettings] = useState({
    gasLimit: '',
    maxFeePerGas: '',
    maxPriorityFeePerGas: ''
  });

  const handleNetworkChange = async (newChainId: string) => {
    try {
      await switchNetwork(newChainId);
      toast.success(`Switched to network ${newChainId}`);
    } catch (error) {
      toast.error('Failed to switch network');
    }
  };

  const handleGasSettingsChange = (
    field: keyof typeof customGasSettings,
    value: string
  ) => {
    const newSettings = {
      ...customGasSettings,
      [field]: value
    };
    setCustomGasSettings(newSettings);
    updateGasSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Network Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Network
            </label>
            <p className="mt-1 text-sm text-gray-500">
              {chainId || 'Not connected'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Switch Network
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              onChange={(e) => handleNetworkChange(e.target.value)}
              value={chainId || ''}
            >
              <option value="">Select Network</option>
              <option value="0x1">Ethereum Mainnet</option>
              <option value="0x5">Goerli Testnet</option>
              <option value="0xaa36a7">Sepolia Testnet</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Gas Settings</h2>
        <div className="space-y-4">
          {gasPrices && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Gas Prices
              </label>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-500">
                  Slow: {gasPrices.slow} Gwei
                </p>
                <p className="text-sm text-gray-500">
                  Standard: {gasPrices.standard} Gwei
                </p>
                <p className="text-sm text-gray-500">
                  Fast: {gasPrices.fast} Gwei
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Gas Limit
            </label>
            <input
              type="text"
              value={customGasSettings.gasLimit}
              onChange={(e) => handleGasSettingsChange('gasLimit', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter gas limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Fee (Gwei)
            </label>
            <input
              type="text"
              value={customGasSettings.maxFeePerGas}
              onChange={(e) => handleGasSettingsChange('maxFeePerGas', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter max fee"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Priority Fee (Gwei)
            </label>
            <input
              type="text"
              value={customGasSettings.maxPriorityFeePerGas}
              onChange={(e) => handleGasSettingsChange('maxPriorityFeePerGas', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter priority fee"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Wallet Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Connected Wallet
            </label>
            <p className="mt-1 text-sm text-gray-500">
              {account || 'Not connected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 