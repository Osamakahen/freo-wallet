import { createWalletClient, createPublicClient, custom, getAddress, formatEther, EIP1193Provider } from 'viem';
import { mainnet, goerli, sepolia, Chain } from 'viem/chains';
import { TransactionRequest } from '../../types/wallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class EVMAdapter extends WalletAdapter {
  constructor(chain: Chain) {
    super(chain);
  }
}

export class WalletAdapter {
  private walletClient: ReturnType<typeof createWalletClient>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private chain: Chain;
  private ethereum: EIP1193Provider;

  constructor(chain: Chain = mainnet) {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Ethereum provider not found');
    }

    this.ethereum = window.ethereum as EIP1193Provider;
    this.chain = chain;
    this.walletClient = createWalletClient({
      chain,
      transport: custom(this.ethereum)
    });
    this.publicClient = createPublicClient({
      chain,
      transport: custom(this.ethereum)
    });
  }

  async getAddress(): Promise<`0x${string}`> {
    const [address] = await this.walletClient.getAddresses();
    return getAddress(address);
  }

  async getBalance(address: `0x${string}`): Promise<string> {
    const balance = await this.publicClient.getBalance({ address });
    return formatEther(balance);
  }

  async sendTransaction(tx: TransactionRequest): Promise<`0x${string}`> {
    const hash = await this.walletClient.sendTransaction({
      to: tx.to,
      data: tx.data as `0x${string}` | undefined,
      value: tx.value ? BigInt(tx.value) : undefined,
      gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
      gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
      maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
      nonce: tx.nonce,
      chain: this.chain
    });

    return hash;
  }

  async signMessage(message: string): Promise<`0x${string}`> {
    const address = await this.getAddress();
    return this.walletClient.signMessage({
      account: address,
      message
    });
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
      this.chain = this.getChainById(chainId);
    } catch (error) {
      if ((error as Error).message.includes('Unrecognized chain ID')) {
        await this.addChain(chainId);
      } else {
        throw error;
      }
    }
  }

  private async addChain(chainId: number): Promise<void> {
    const chain = this.getChainById(chainId);
    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls.default.http,
          blockExplorerUrls: chain.blockExplorers?.default.url
            ? [chain.blockExplorers.default.url]
            : undefined
        }
      ]
    });
    this.chain = chain;
  }

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

  getChain(): Chain {
    return this.chain;
  }
} 