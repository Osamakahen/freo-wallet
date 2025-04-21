export interface GasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  timestamp: number;
}

export interface GasSettings {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface GasOptimizationOptions {
  speed?: 'slow' | 'standard' | 'fast';
  maxGasPrice?: string;
  maxPriorityFee?: string;
  maxGasLimit?: string;
  maxCost?: string;
}

export interface GasPriceUpdate {
  baseFee: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  timestamp: number;
}

export interface GasHistory {
  prices: GasPriceUpdate[];
  timestamps: number[];
  average: {
    baseFee: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

export interface GasSimulationResult {
  success: boolean;
  gasUsed: string;
  error?: string;
}

export interface GasContext {
  gasManager: any; // We'll fix this type later
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

export interface GasContextType {
  gasManager: any; // We'll fix this type later
  gasEstimate: GasEstimate | null;
  gasPrices: GasPriceUpdate | null;
  gasHistory: GasHistory | null;
  loading: boolean;
  error: string | null;
  simulationResult: GasSimulationResult | null;
  updateGasSettings: (settings: GasSettings) => void;
  simulateTransaction: (from: `0x${string}`, to: `0x${string}`, value: string, data?: `0x${string}`) => Promise<void>;
} 