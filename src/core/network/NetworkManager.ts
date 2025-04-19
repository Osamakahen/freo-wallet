import { ethers } from 'ethers';
import { WalletConfig } from '../../types/wallet';
import { EVMAdapter } from '../chain/EVMAdapter';
import { NetworkError } from '../errors/WalletErrors';
import { mainnet, goerli, sepolia } from 'viem/chains';
import { Chain } from 'viem';

export class NetworkManager {
  private adapter: EVMAdapter;
  private provider: ethers.JsonRpcProvider;
  private config: WalletConfig;

  private getChainById(chainId: number): Chain {
    switch (chainId) {
      case mainnet.id:
        return mainnet;
      case goerli.id:
        return goerli;
      case sepolia.id:
        return sepolia;
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  constructor(config: WalletConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const chain = this.getChainById(config.chainId);
    this.adapter = new EVMAdapter(chain);
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
      const chain = this.getChainById(config.chainId);
      this.adapter = new EVMAdapter(chain);
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
} 