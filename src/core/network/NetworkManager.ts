import { ethers } from 'ethers';
import { WalletConfig } from '../../types/wallet';
import { EVMAdapter } from '../chain/EVMAdapter';
import { NetworkError } from '../errors/WalletErrors';

export class NetworkManager {
  private adapter: EVMAdapter;
  private provider: ethers.providers.JsonRpcProvider;
  private config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.adapter = new EVMAdapter(config);
  }

  async connect(): Promise<void> {
    try {
      await this.provider.ready;
      const network = await this.provider.getNetwork();
      if (network.chainId !== this.config.chainId) {
        throw new NetworkError(
          'Network mismatch',
          {
            error: new Error(`Expected chainId ${this.config.chainId}, got ${network.chainId}`),
            chainId: network.chainId,
            expectedChainId: this.config.chainId
          }
        );
      }
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      throw new NetworkError(
        'Failed to connect to network',
        {
          error: new Error(error instanceof Error ? error.message : String(error)),
          chainId: this.config.chainId
        }
      );
    }
  }

  async switchNetwork(config: WalletConfig): Promise<void> {
    try {
      this.config = config;
      this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      this.adapter = new EVMAdapter(config);
      await this.connect();
    } catch (error) {
      throw new NetworkError(
        'Failed to switch network',
        {
          error: new Error(error instanceof Error ? error.message : String(error)),
          chainId: config.chainId
        }
      );
    }
  }

  getAdapter(): EVMAdapter {
    return this.adapter;
  }

  getProvider(): ethers.providers.JsonRpcProvider {
    return this.provider;
  }

  getCurrentNetwork(): WalletConfig {
    return this.config;
  }

  async getGasPrice(): Promise<string> {
    return (await this.provider.getGasPrice()).toString();
  }

  async estimateGas(tx: any): Promise<string> {
    return (await this.provider.estimateGas(tx)).toString();
  }
} 