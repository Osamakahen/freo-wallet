import { createWalletClient, custom, parseUnits, formatUnits, createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { WebSocketTransactionMonitor } from '../transaction/WebSocketTransactionMonitor';
import { TokenMetadata } from '../types/wallet';
import { ApprovalTransaction } from '../../types/token';

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
] as const;

export interface ApprovalRequest {
  tokenAddress: `0x${string}`;
  spender: `0x${string}`;
  amount: string;
  tokenMetadata: TokenMetadata;
}

export interface ApprovalStatus {
  isApproved: boolean;
  approvedAmount: string;
}

export interface GasEstimate {
  gasLimit: bigint;
  estimatedCost: string;
}

export interface ApprovalTransaction {
  hash: `0x${string}`;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  type: 'approve' | 'approveMax' | 'revoke';
  amount?: string;
  gasEstimate?: string;
}

export class TokenApprovalManager {
  private walletClient: ReturnType<typeof createWalletClient>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private transactionMonitor: WebSocketTransactionMonitor;
  private transactionHistory: ApprovalTransaction[] = [];

  constructor() {
    if (!window.ethereum) {
      throw new Error('Ethereum provider not found');
    }

    this.walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    });

    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });

    this.transactionMonitor = new WebSocketTransactionMonitor();
  }

  async checkApproval(tokenAddress: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`): Promise<ApprovalStatus> {
    try {
      const allowance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender]
      });

      return {
        isApproved: allowance > 0n,
        approvedAmount: formatUnits(allowance, 18)
      };
    } catch (error) {
      throw new Error('Failed to check approval status');
    }
  }

  async estimateGas(request: ApprovalRequest): Promise<GasEstimate> {
    try {
      const amount = parseUnits(request.amount, request.tokenMetadata.decimals);
      const gasLimit = await this.publicClient.estimateContractGas({
        address: request.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [request.spender, amount],
        account: this.walletClient.account?.address
      });

      const gasPrice = await this.publicClient.getGasPrice();
      const estimatedCost = formatUnits(gasLimit * gasPrice, 18);

      return {
        gasLimit,
        estimatedCost
      };
    } catch (error) {
      throw new Error('Failed to estimate gas');
    }
  }

  async approveToken(amount: string): Promise<string> {
    try {
      const tx = await this.transactionManager.createTransaction({
        to: this.tokenAddress,
        data: this.encodeApproveData(amount),
        value: '0x0'
      });
      
      return await this.transactionManager.sendTransaction(tx);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to approve token', 'TOKEN_APPROVAL_ERROR', { error })
      );
      throw error;
    }
  }

  async approveMaxToken(request: ApprovalRequest): Promise<ApprovalTransaction> {
    try {
      const maxAmount = 2n ** 256n - 1n;
      const gasEstimate = await this.estimateGas({
        ...request,
        amount: maxAmount.toString()
      });

      const hash = await this.walletClient.writeContract({
        address: request.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [request.spender, maxAmount],
        gas: gasEstimate.gasLimit
      });

      const transaction: ApprovalTransaction = {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        type: 'approveMax',
        gasEstimate: gasEstimate.estimatedCost
      };

      this.transactionHistory.push(transaction);
      this.transactionMonitor.startMonitoring(hash);

      return transaction;
    } catch (error) {
      throw new Error('Failed to approve max token amount');
    }
  }

  async revokeApproval(tokenAddress: `0x${string}`, spender: `0x${string}`): Promise<ApprovalTransaction> {
    try {
      const gasEstimate = await this.estimateGas({
        tokenAddress,
        spender,
        amount: '0',
        tokenMetadata: { decimals: 18, symbol: '' }
      });

      const hash = await this.walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, 0n],
        gas: gasEstimate.gasLimit
      });

      const transaction: ApprovalTransaction = {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        type: 'revoke',
        gasEstimate: gasEstimate.estimatedCost
      };

      this.transactionHistory.push(transaction);
      this.transactionMonitor.startMonitoring(hash);

      return transaction;
    } catch (error) {
      throw new Error('Failed to revoke approval');
    }
  }

  subscribeToTransactionUpdates(hash: `0x${string}`, callback: (status: 'pending' | 'confirmed' | 'failed') => void): () => void {
    return this.transactionMonitor.subscribeToTransactionUpdates(hash, (status) => {
      const transaction = this.transactionHistory.find(tx => tx.hash === hash);
      if (transaction) {
        transaction.status = status;
        callback(status);
      }
    });
  }

  getTransactionHistory(): ApprovalTransaction[] {
    return [...this.transactionHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  getTransactionByHash(hash: `0x${string}`): ApprovalTransaction | undefined {
    return this.transactionHistory.find(tx => tx.hash === hash);
  }

  async getAllowance(tokenAddress: Address, owner: Address, spender: Address): Promise<bigint> {
    try {
      const allowance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' }
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'allowance',
        args: [owner, spender]
      });

      return allowance as bigint;
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw new Error('Failed to get allowance');
    }
  }

  async getTransactionHistory(tokenAddress: Address, owner: Address): Promise<ApprovalTransaction[]> {
    try {
      // In a real implementation, this would query the blockchain for approval events
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  async approve(tokenAddress: Address, spender: Address, amount: bigint): Promise<void> {
    try {
      // In a real implementation, this would send a transaction to approve tokens
      // For now, we'll just simulate the approval
      console.log(`Approving ${amount} tokens for ${spender}`);
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw new Error('Failed to approve tokens');
    }
  }

  async revoke(tokenAddress: Address, spender: Address): Promise<void> {
    try {
      // In a real implementation, this would send a transaction to revoke approval
      // For now, we'll just simulate the revocation
      console.log(`Revoking approval for ${spender}`);
    } catch (error) {
      console.error('Error revoking approval:', error);
      throw new Error('Failed to revoke approval');
    }
  }
} 