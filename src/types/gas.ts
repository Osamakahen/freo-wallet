import { GasEstimate, GasPrice, GasSettings, GasOptimizationOptions, GasPriceUpdate } from '../core/gas/GasManager';

export interface GasContext {
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
  updateGasSettings: (settings: GasSettings) => void;
}

export interface GasHistory {
  prices: GasPriceUpdate[];
  timestamps: number[];
}

export interface GasSimulationResult {
  success: boolean;
  gasUsed: string;
  error?: string;
}

export type { GasEstimate, GasPrice, GasSettings, GasOptimizationOptions, GasPriceUpdate };

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  timestamp: number;
}

export interface GasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface GasSettings {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface GasContextType {
  gasManager: GasManager;
  gasEstimate: GasEstimate | null;
  gasPrices: GasPriceUpdate | null;
  gasHistory: GasHistory | null;
  loading: boolean;
  error: string | null;
  simulationResult: GasSimulationResult | null;
  updateGasSettings: (settings: GasSettings) => void;
  simulateTransaction: (from: `0x${string}`, to: `0x${string}`, value: string, data?: `0x${string}`) => Promise<void>;
} 