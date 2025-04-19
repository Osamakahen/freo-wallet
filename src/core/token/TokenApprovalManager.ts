import { createWalletClient, custom, parseUnits, formatUnits, createPublicClient, http, Address, getContract, encodeFunctionData } from 'viem';
import { mainnet } from 'viem/chains';
import { WebSocketTransactionMonitor } from '../transaction/WebSocketTransactionMonitor';
import { TokenMetadata } from '../../types/wallet';
import { ApprovalTransaction } from '../../types/token';
import { TransactionManager } from '../transaction/TransactionManager';
import { KeyManager } from '../keyManagement/KeyManager';
import { ERC20_ABI } from '../../constants/abis';
import { WalletError } from '../error/ErrorHandler';

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

export class TokenApprovalManager {
  private walletClient: ReturnType<typeof createWalletClient>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private transactionMonitor: WebSocketTransactionMonitor;
  private transactionHistory: ApprovalTransaction[] = [];
  private transactionManager: TransactionManager;
  private keyManager: KeyManager;
  private tokenAddress: `0x${string}`;

  constructor(tokenAddress: `0x${string}`, rpcUrl: string) {
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
    this.keyManager = new KeyManager();
    this.transactionManager = new TransactionManager(rpcUrl, this.keyManager);
    this.tokenAddress = tokenAddress;
  }

  async checkApproval(tokenAddress: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`): Promise<ApprovalStatus> {
    try {
      const allowance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender]
      }) as bigint;

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

  private encodeApproveData(spender: `0x${string}`, amount: string): `0x${string}` {
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, BigInt(amount)]
    });
  }

  async approveToken(amount: string, tokenAddress?: Address, spender?: Address): Promise<`0x${string}`> {
    try {
      const [from] = await this.walletClient.getAddresses();
      const targetTokenAddress = tokenAddress || this.tokenAddress;
      const targetSpender = spender || this.tokenAddress;
      
      const approveData = this.encodeApproveData(targetSpender as `0x${string}`, amount);
      const tx = await this.transactionManager.createTransaction({
        from,
        to: targetTokenAddress,
        data: approveData as `0x${string}`,
        value: '0'
      });

      const hash = await this.walletClient.sendTransaction({
        account: from,
        to: tx.to,
        data: approveData,
        value: 0n
      });

      // Add to transaction history
      this.transactionHistory.push({
        type: 'approve',
        amount,
        status: 'pending',
        timestamp: Date.now(),
        hash,
        gasEstimate: undefined
      });

      return hash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw new Error('Failed to approve token');
    }
  }

  async approveMaxToken(request: ApprovalRequest): Promise<ApprovalTransaction> {
    try {
      const [from] = await this.walletClient.getAddresses();
      const maxAmount = 2n ** 256n - 1n;
      const approveData = this.encodeApproveData(request.spender, maxAmount.toString());
      const tx = await this.transactionManager.createTransaction({
        from,
        to: request.tokenAddress,
        data: approveData,
        value: '0'
      });

      const hash = await this.walletClient.sendTransaction({
        account: from,
        to: tx.to,
        data: approveData,
        value: 0n
      });

      const transaction: ApprovalTransaction = {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        type: 'approve',
        amount: maxAmount.toString()
      };

      this.transactionHistory.push(transaction);
      return transaction;
    } catch (error) {
      console.error('Error approving max token:', error);
      throw new Error('Failed to approve max token amount');
    }
  }

  async revokeApproval(tokenAddress: `0x${string}`, spender: `0x${string}`): Promise<ApprovalTransaction> {
    try {
      const [from] = await this.walletClient.getAddresses();
      const tx = await this.transactionManager.createTransaction({
        from,
        to: tokenAddress,
        data: this.encodeApproveData(spender, '0'),
        value: 0n
      });

      const hash = await this.walletClient.sendTransaction({
        account: from,
        to: tx.to,
        data: tx.data,
        value: 0n
      });

      const transaction: ApprovalTransaction = {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        type: 'approve',
        amount: '0'
      };

      this.transactionHistory.push(transaction);
      return transaction;
    } catch (error) {
      console.error('Error revoking approval:', error);
      throw new Error('Failed to revoke approval');
    }
  }

  subscribeToTransactionUpdates(hash: `0x${string}`, callback: (status: 'pending' | 'confirmed' | 'failed') => void): () => void {
    return this.transactionMonitor.subscribe(hash, (status) => {
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
      }) as bigint;

      return allowance;
    } catch (error) {
      throw new Error('Failed to get allowance');
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