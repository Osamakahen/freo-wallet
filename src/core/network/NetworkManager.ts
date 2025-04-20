import { ethers } from 'ethers';
import { WalletConfig } from '../../types/wallet';
import { EVMAdapter } from './EVMAdapter';
import { NetworkError } from '../errors/WalletErrors';
import { Chain } from 'viem';

export class NetworkManager {
  private adapter: EVMAdapter;
  private provider: ethers.JsonRpcProvider;
  private config: WalletConfig;

  constructor(config: WalletConfig) {
    const chainConfig = this.getChainConfig(config);
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.adapter = new EVMAdapter(chainConfig);
    this.config = config;
  }

  private getChainConfig(config: WalletConfig): Chain {
    return {
      id: config.chainId,
      name: config.networkName,
      nativeCurrency: {
        name: config.networkName,
        symbol: config.symbol,
        decimals: 18
      },
      rpcUrls: {
        default: { http: [config.rpcUrl] }
      },
      blockExplorers: config.blockExplorer ? {
        default: {
          name: config.networkName,
          url: config.blockExplorer
        }
      } : undefined
    };
  }

  async connect(): Promise<void> {
    try {
      await this.provider.ready;
      const network = await this.provider.getNetwork();
      if (BigInt(network.chainId) !== BigInt(this.config.chainId)) {
        throw new NetworkError(
          `Network mismatch: Expected chainId ${this.config.chainId}, got ${network.chainId}`,
          Number(network.chainId)
        );
      }
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(
        `Failed to connect to network: ${error instanceof Error ? error.message : String(error)}`,
        this.config.chainId
      );
    }
  }

  async switchNetwork(config: WalletConfig): Promise<void> {
    try {
      this.config = config;
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const chainConfig = this.getChainConfig(config);
      this.adapter = new EVMAdapter(chainConfig);
      await this.connect();
    } catch (error) {
      throw new NetworkError(
        `Failed to switch network: ${error instanceof Error ? error.message : String(error)}`,
        config.chainId
      );
    }
  }

  getAdapter(): EVMAdapter {
    return this.adapter;
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getCurrentNetwork(): WalletConfig {
    return this.config;
  }

  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getFeeData();
    return gasPrice.gasPrice?.toString() || '0';
  }

  async estimateGas(tx: any): Promise<string> {
    return (await this.provider.estimateGas(tx)).toString();
  }

  getTransactionExplorerUrl(hash: string): string {
    const chainConfig = this.getChainConfig(this.config);
    return `${chainConfig.blockExplorers?.default?.url}/tx/${hash}`;
  }
} 