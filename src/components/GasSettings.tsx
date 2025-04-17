import React, { useState, useEffect, useCallback } from 'react';
import { useGas } from '../contexts/GasContext';
import { formatGwei } from 'viem';

interface GasSettingsProps {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  data?: `0x${string}`;
}

export const GasSettings: React.FC<GasSettingsProps> = ({
  from,
  to,
  value,
  data
}) => {
  const {
    gasManager,
    gasPrices,
    loading,
    error,
    simulationResult,
    updateGasSettings
  } = useGas();

  const [customSettings, setCustomSettings] = useState({
    gasLimit: '',
    maxFeePerGas: '',
    maxPriorityFeePerGas: ''
  });

  const loadGasData = useCallback(async () => {
    try {
      const estimate = await gasManager.getGasEstimate(from, to, value, data);
      setCustomSettings({
        gasLimit: estimate.gasLimit.toString(),
        maxFeePerGas: formatGwei(BigInt(estimate.maxFeePerGas)),
        maxPriorityFeePerGas: formatGwei(BigInt(estimate.maxPriorityFeePerGas))
      });
    } catch (err) {
      console.error('Failed to load gas data:', err);
    }
  }, [from, to, value, data, gasManager]);

  useEffect(() => {
    loadGasData();
  }, [loadGasData]);

  const handleCustomSettingsChange = (
    field: keyof typeof customSettings,
    value: string
  ) => {
    const newSettings = {
      ...customSettings,
      [field]: value
    };
    setCustomSettings(newSettings);
    updateGasSettings(newSettings);
  };

  if (loading) {
    return <div className="text-blue-500">Loading gas data...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Current Gas Prices</h3>
          {gasPrices && (
            <div className="space-y-2">
              <p>Slow: {formatGwei(BigInt(gasPrices.slow))} Gwei</p>
              <p>Standard: {formatGwei(BigInt(gasPrices.standard))} Gwei</p>
              <p>Fast: {formatGwei(BigInt(gasPrices.fast))} Gwei</p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(gasPrices.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Transaction Simulation</h3>
          {simulationResult && (
            <div className={`space-y-2 ${simulationResult.success ? 'text-green-500' : 'text-red-500'}`}>
              <p>Status: {simulationResult.success ? 'Success' : 'Failed'}</p>
              <p>Gas Used: {simulationResult.gasUsed}</p>
              {simulationResult.error && (
                <p className="text-sm">Error: {simulationResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Custom Gas Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Gas Limit</label>
            <input
              type="text"
              value={customSettings.gasLimit}
              onChange={(e) => handleCustomSettingsChange('gasLimit', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Fee (Gwei)</label>
            <input
              type="text"
              value={customSettings.maxFeePerGas}
              onChange={(e) => handleCustomSettingsChange('maxFeePerGas', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority Fee (Gwei)</label>
            <input
              type="text"
              value={customSettings.maxPriorityFeePerGas}
              onChange={(e) => handleCustomSettingsChange('maxPriorityFeePerGas', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 