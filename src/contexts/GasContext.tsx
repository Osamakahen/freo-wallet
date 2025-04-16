import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GasManager } from '../core/gas/GasManager';
import { GasEstimate, GasPrice, GasHistory, GasSimulationResult } from '../types/gas';
import { toast } from 'react-toastify';

interface GasContextType {
  gasManager: GasManager;
  gasPrices: GasPrice | null;
  gasHistory: GasHistory | null;
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
  const [gasManager] = useState(() => new GasManager(process.env.REACT_APP_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'));
  const [gasPrices, setGasPrices] = useState<GasPrice | null>(null);
  const [gasHistory, setGasHistory] = useState<GasHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<GasSimulationResult | null>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);

  useEffect(() => {
    startGasPriceUpdates();
  }, [startGasPriceUpdates]);

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

  const updateGasSettings = useCallback(async (settings: {
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const history = await gasManager.getGasHistory();
      setGasHistory(history);

      // Simulate transaction with new settings
      const simulation = await gasManager.simulateTransaction(
        '0x0000000000000000000000000000000000000000', // Placeholder address
        '0x0000000000000000000000000000000000000000', // Placeholder address
        '0',
        '0x',
        settings
      );

      setSimulationResult({
        success: simulation.success,
        gasUsed: simulation.gasUsed.toString(),
        error: simulation.error
      });

      if (!simulation.success) {
        toast.warning('Transaction simulation failed: ' + simulation.error, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update gas settings';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [gasManager]);

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
      setGasEstimate(estimate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get gas estimate';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [gasManager]);

  const value = {
    gasManager,
    gasPrices,
    gasHistory,
    loading,
    error,
    simulationResult,
    gasEstimate,
    getGasEstimate,
    updateGasSettings,
  };

  return <GasContext.Provider value={value}>{children}</GasContext.Provider>;
};

export const useGas = () => {
  const context = useContext(GasContext);
  if (context === undefined) {
    throw new Error('useGas must be used within a GasProvider');
  }
  return context;
}; 