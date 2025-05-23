import { createPublicClient, http, PublicClient, WalletClient, createWalletClient, formatGwei, parseEther } from 'viem';
import { mainnet } from 'viem/chains';
import { EventEmitter } from 'events';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { 
  GasEstimate, 
  GasPrice, 
  GasSettings, 
  GasOptimizationOptions, 
  GasPriceUpdate,
  GasHistory,
  GasSimulationResult
} from '../../types/gas';
import { WalletError } from '../error/ErrorHandler';
import { TransactionRequest } from '../../types/wallet';

interface LocalGasEstimate {
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  timestamp: number;
}

export class GasManager extends EventEmitter {
  private client: ReturnType<typeof createPublicClient>;
  private readonly DEFAULT_GAS_LIMIT = '21000';
  private readonly SPEED_MULTIPLIERS = {
    slow: 1.0,
    standard: 1.5,
    fast: 2.0
  };
  private readonly GAS_LIMIT_BUFFER = BigInt(10000);
  private readonly PRIORITY_FEE_MULTIPLIER = BigInt(15);
  private readonly GAS_PRICE_UPDATE_INTERVAL = 30000;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastGasPrice: GasPrice | null = null;
  private static instance: GasManager;
  private estimates: Map<string, LocalGasEstimate> = new Map();
  private errorCorrelator: ErrorCorrelator;
  private gasPriceCache: Map<string, number>;
  private lastUpdate: number;
  private rpcUrl: string;

  constructor(rpcUrl: string, errorCorrelator: ErrorCorrelator) {
    super();
    this.rpcUrl = rpcUrl;
    this.errorCorrelator = errorCorrelator;
    this.gasPriceCache = new Map();
    this.lastUpdate = 0;
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl)
    });
  }

  static getInstance(): GasManager {
    if (!GasManager.instance) {
      GasManager.instance = new GasManager('https://rpc.ankr.com/eth', ErrorCorrelator.getInstance());
    }
    return GasManager.instance;
  }

  public startGasPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const gasPrice = await this.getCurrentGasPrice();
        this.lastGasPrice = gasPrice;
        
        this.emit('gasPriceUpdate', {
          baseFee: formatGwei(BigInt(gasPrice.slow)),
          maxFeePerGas: formatGwei(BigInt(gasPrice.standard)),
          maxPriorityFeePerGas: formatGwei(BigInt(gasPrice.fast)),
          timestamp: Date.now()
        });
      } catch (error) {
        this.emit('error', new Error(`Failed to update gas price: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }, this.GAS_PRICE_UPDATE_INTERVAL);
  }

  public stopGasPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public async getGasEstimate(
    from: `0x${string}`,
    to: `0x${string}`,
    value: string,
    data?: `0x${string}`
  ): Promise<GasEstimate> {
    try {
      const [block, maxPriorityFee, gasEstimate] = await Promise.all([
        this.client.getBlock(),
        this.client.estimateMaxPriorityFeePerGas(),
        this.client.estimateGas({
          account: from,
          to,
          value: parseEther(value),
          data
        })
      ]);

      if (!block.baseFeePerGas) {
        throw new Error('Failed to get base fee');
      }

      if (!maxPriorityFee) {
        throw new Error('Failed to get max priority fee');
      }

      const baseFee = block.baseFeePerGas;
      const maxFee = baseFee + maxPriorityFee;
      const estimatedCost = maxFee * gasEstimate;

      // Check if gas cost is too high
      if (estimatedCost > parseEther('0.1')) {
        throw new Error('Estimated gas cost is too high. Consider reducing the transaction size or waiting for lower gas prices.');
      }

      return {
        gasLimit: gasEstimate.toString(),
        maxFeePerGas: maxFee.toString(),
        maxPriorityFeePerGas: maxPriorityFee.toString()
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gas estimation failed: ${error.message}`);
      }
      throw new Error('Failed to estimate gas');
    }
  }

  public async getOptimalGasSettings(
    from: `0x${string}`,
    to: `0x${string}`,
    value: string,
    data?: `0x${string}`,
    options?: GasOptimizationOptions
  ): Promise<GasSettings> {
    try {
      const estimate = await this.getGasEstimate(from, to, value, data);
      const speedMultiplier = options?.speed ? this.SPEED_MULTIPLIERS[options.speed] : 1.5;

      const optimalMaxPriorityFee = BigInt(Math.floor(Number(estimate.maxPriorityFeePerGas) * speedMultiplier));
      const optimalMaxFee = BigInt(estimate.maxFeePerGas) + optimalMaxPriorityFee;

      let gasLimit = BigInt(estimate.gasLimit);
      if (options?.maxCost) {
        const maxCost = parseEther(options.maxCost);
        const maxGasLimit = maxCost / optimalMaxFee;
        if (maxGasLimit < gasLimit) {
          gasLimit = maxGasLimit;
        }
      }

      if (options?.maxGasLimit) {
        const maxGasLimit = BigInt(options.maxGasLimit);
        if (maxGasLimit < gasLimit) {
          gasLimit = maxGasLimit;
        }
      }

      return {
        maxPriorityFeePerGas: formatGwei(optimalMaxPriorityFee),
        maxFeePerGas: formatGwei(optimalMaxFee),
        gasLimit: gasLimit.toString()
      };
    } catch (error) {
      throw new Error(`Failed to get optimal gas settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getCurrentGasPrice(): Promise<GasPrice> {
    try {
      const baseFee = await this.client.getBlock({ blockTag: 'latest' }).then(block => block.baseFeePerGas);

      if (!baseFee) {
        throw new Error('Failed to get base fee');
      }

      // Calculate different gas price tiers
      const slow = (baseFee * 11n / 10n).toString();
      const standard = (baseFee * 12n / 10n).toString();
      const fast = (baseFee * 13n / 10n).toString();

      return {
        slow,
        standard,
        fast,
        timestamp: Date.now(),
      };
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to update gas price', 'GAS_PRICE_UPDATE_ERROR', { error: error instanceof Error ? error : new Error(String(error)) })
      );
      throw new Error(`Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getGasHistory(limit: number = 10): Promise<GasHistory> {
    try {
      const currentBlock = await this.client.getBlockNumber();
      const prices = [];

      for (let i = 0; i < limit; i++) {
        const block = await this.client.getBlock({ blockNumber: currentBlock - BigInt(i) });
        if (!block.baseFeePerGas) continue;

        const baseFee = block.baseFeePerGas;
        prices.push({
          timestamp: Number(block.timestamp) * 1000,
          baseFee: baseFee.toString(),
          maxFeePerGas: (baseFee * 13n / 10n).toString(),
          maxPriorityFeePerGas: (baseFee * 3n / 10n).toString()
        });
      }

      // Calculate averages
      const average = {
        baseFee: (prices.reduce((sum, p) => sum + BigInt(p.baseFee), 0n) / BigInt(prices.length)).toString(),
        maxFeePerGas: (prices.reduce((sum, p) => sum + BigInt(p.maxFeePerGas), 0n) / BigInt(prices.length)).toString(),
        maxPriorityFeePerGas: (prices.reduce((sum, p) => sum + BigInt(p.maxPriorityFeePerGas), 0n) / BigInt(prices.length)).toString()
      };

      return { 
        prices, 
        timestamps: prices.map(p => p.timestamp),
        average 
      };
    } catch (error) {
      throw new Error(`Failed to get gas history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async simulateTransaction(
    from: `0x${string}`,
    to: `0x${string}`,
    value: string,
    _data: `0x${string}` = '0x',
    gasSettings: GasSettings
  ): Promise<GasSimulationResult> {
    try {
      await this.client.simulateContract({
        account: from,
        address: to,
        value: parseEther(value) as unknown as undefined,
        abi: [], // Empty ABI for simple value transfers
        functionName: 'transfer',
        gas: BigInt(gasSettings.gasLimit),
        maxFeePerGas: BigInt(gasSettings.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasSettings.maxPriorityFeePerGas),
      });

      return {
        success: true,
        gasUsed: '0',
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: '0',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public getLastGasPrice(): GasPrice | null {
    return this.lastGasPrice;
  }

  async estimateGas(transaction: TransactionRequest): Promise<number> {
    try {
      const { to, value, data } = transaction;
      
      // Use the data parameter to estimate gas
      const gasEstimate = await this.client.estimateGas({
        to,
        value: BigInt(value),
        data: data as `0x${string}` | undefined
      });
      
      return Number(gasEstimate);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to estimate gas', 'GAS_ESTIMATION_ERROR', { error: error as Error })
      );
      throw error;
    }
  }

  getLastEstimate(to: string): GasEstimate | undefined {
    const estimate = this.estimates.get(to);
    if (!estimate) return undefined;
    
    return {
      gasLimit: estimate.gasLimit.toString(),
      maxFeePerGas: estimate.maxFeePerGas.toString(),
      maxPriorityFeePerGas: estimate.maxPriorityFeePerGas.toString()
    };
  }

  clearEstimates(): void {
    this.estimates.clear();
  }

  private async updateGasPrice(): Promise<void> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });
      
      const result = await response.json();
      this.gasPriceCache = result.result;
      this.lastUpdate = Date.now();
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to update gas price', 'GAS_PRICE_UPDATE_ERROR', { error: error instanceof Error ? error : new Error(String(error)) })
      );
    }
  }
} 