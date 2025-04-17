import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GasManager } from '../core/gas/GasManager';
import { GasEstimate, GasPrice, GasSimulationResult } from '../types/gas';
import { ErrorCorrelator } from '../core/error/ErrorCorrelator';
import { toast } from 'react-toastify';

interface GasContextType {
  gasManager: GasManager;
  gasPrices: GasPrice | null;
  loading: boolean;
  error: string | null;
  simulationResult: GasSimulationResult | null;
  gasEstimate: GasEstimate | null;
  getGasEstimate: (
    from: `0x${string}`,
    to: `0x${string}`,
    value: string,
    data?: `0x${string}`
  ) => Promise<void>;
  updateGasSettings: (settings: {
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }) => void;
}

const GasContext = createContext<GasContextType | undefined>(undefined);

export const GasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errorCorrelator] = useState(() => ErrorCorrelator.getInstance());
  const [gasManager] = useState(() => new GasManager(
    process.env.REACT_APP_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    errorCorrelator
  ));
  const [gasPrices, setGasPrices] = useState<GasPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<GasSimulationResult | null>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);

  const startGasPriceUpdates = useCallback(() => {
    gasManager.startGasPriceUpdates();
    gasManager.on('gasPriceUpdate', (update: GasPrice) => {
      setGasPrices(update);
      toast.info('Gas prices updated', {
        position: 'top-right',
        autoClose: 3000,
      });
    });
    gasManager.on('error', (error: Error) => {
      setError(error.message);
      toast.error(error.message, {
        position: 'top-right',
        autoClose: 5000,
      });
    });
  }, [gasManager]);

  useEffect(() => {
    startGasPriceUpdates();
    return () => {
      gasManager.stopGasPriceUpdates();
    };
  }, [gasManager, startGasPriceUpdates]);

  const getGasEstimate = useCallback(async (
    from: `0x${string}`,
    to: `0x${string}`,
    value: string,
    data?: `0x${string}`
  ) => {
    try {
      setLoading(true);
      setError(null);
      const estimate = await gasManager.getGasEstimate(from, to, value, data);
      setGasEstimate({
        gasLimit: estimate.gasLimit.toString(),
        maxFeePerGas: estimate.maxFeePerGas.toString(),
        maxPriorityFeePerGas: estimate.maxPriorityFeePerGas.toString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to estimate gas');
      toast.error('Failed to estimate gas', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [gasManager]);

  const updateGasSettings = useCallback(async (settings: {
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      await gasManager.getOptimalGasSettings(
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0',
        '0x',
        {
          maxGasLimit: settings.gasLimit,
          maxCost: settings.maxFeePerGas
        }
      );
      toast.success('Gas settings updated', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gas settings');
      toast.error('Failed to update gas settings', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [gasManager]);

  return (
    <GasContext.Provider
      value={{
        gasManager,
        gasPrices,
        loading,
        error,
        simulationResult,
        gasEstimate,
        getGasEstimate,
        updateGasSettings
      }}
    >
      {children}
    </GasContext.Provider>
  );
};

export const useGas = () => {
  const context = useContext(GasContext);
  if (context === undefined) {
    throw new Error('useGas must be used within a GasProvider');
  }
  return context;
}; 