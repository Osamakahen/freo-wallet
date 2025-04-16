import { TransactionManager } from '../TransactionManager';
import { WebSocketTransactionMonitor } from '../WebSocketTransactionMonitor';
import { createWalletClient, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { TransactionRequest } from '../../../types/wallet';
import { EVMAdapter } from '../../../core/network/EVMAdapter';

// Mock viem functions
jest.mock('viem', () => ({
  createWalletClient: jest.fn(),
  createPublicClient: jest.fn(),
  http: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

describe('Transaction Flow Integration', () => {
  let transactionManager: TransactionManager;
  let monitor: WebSocketTransactionMonitor;
  const mockFromAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockToAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
  const mockTokenAddress = '0x1111111111111111111111111111111111111111';
  const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create instances with required parameters
    const mockPublicClient = createPublicClient({ chain: mainnet, transport: http() });
    const mockWalletClient = createWalletClient({ chain: mainnet, transport: http() });
    const adapter = new EVMAdapter(mockPublicClient, mockWalletClient);

    transactionManager = new TransactionManager(adapter);
    monitor = new WebSocketTransactionMonitor();
  });

  describe('Complete Transaction Flow', () => {
    it('should successfully complete a transaction with monitoring', async () => {
      // Mock transaction request
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockToAddress as `0x${string}`,
        value: '1000000000000000000', // 1 ETH
        data: '0x',
        nonce: 0,
        gasLimit: '21000',
        status: 'pending'
      };

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn().mockResolvedValue(mockTxHash),
        getAddresses: jest.fn().mockResolvedValue([mockFromAddress])
      };

      // Mock public client
      const mockPublicClient = {
        getTransactionReceipt: jest.fn()
          .mockResolvedValueOnce(null) // First call - transaction pending
          .mockResolvedValueOnce({
            hash: mockTxHash,
            status: 'success',
            blockNumber: 123456n,
            blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            transactionIndex: 0,
            from: mockFromAddress,
            to: mockToAddress,
            logs: [],
            logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            gasUsed: 21000n,
            effectiveGasPrice: 1000000000n,
            cumulativeGasUsed: 21000n,
            contractAddress: null,
            type: '0x0'
          }),
        estimateGas: jest.fn().mockResolvedValue(21000n),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Start transaction
      const txHash = await transactionManager.sendTransaction(txRequest);
      expect(txHash).toBe(mockTxHash);

      // Monitor transaction
      const statusUpdates: string[] = [];
      await monitor.monitorTransaction(txHash as `0x${string}`, (receipt) => {
        statusUpdates.push(receipt.status);
      });

      // Simulate block arrival
      const mockWsClient = {
        watchBlocks: jest.fn().mockImplementation(({ onBlock }) => {
          onBlock({ number: 123456n });
        })
      };
      (createPublicClient as jest.Mock).mockReturnValue(mockWsClient);

      // Wait for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify transaction was successful
      expect(statusUpdates).toContain('success');
      expect(mockPublicClient.getTransactionReceipt).toHaveBeenCalledTimes(2);
    });

    it('should handle transaction failure', async () => {
      // Mock transaction request
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockToAddress as `0x${string}`,
        value: '1000000000000000000',
        data: '0x',
        nonce: 0,
        gasLimit: '21000',
        status: 'pending'
      };

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn().mockRejectedValue(new Error('Transaction failed')),
        getAddresses: jest.fn().mockResolvedValue([mockFromAddress])
      };

      // Setup mocks
      (createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);

      // Attempt transaction
      await expect(transactionManager.sendTransaction(txRequest))
        .rejects
        .toThrow('Transaction failed');
    });

    it('should handle gas estimation failure', async () => {
      // Mock transaction request
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockToAddress as `0x${string}`,
        value: '1000000000000000000',
        data: '0x',
        nonce: 0,
        gasLimit: '21000',
        status: 'pending'
      };

      // Mock public client
      const mockPublicClient = {
        estimateGas: jest.fn().mockRejectedValue(new Error('Gas estimation failed')),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Attempt transaction preparation
      await expect(transactionManager.prepareTransaction(txRequest, 1, 1000000000n, 21000n))
        .rejects
        .toThrow('Gas estimation failed');
    });
  });

  describe('Token Transactions', () => {
    it('should successfully send ERC20 tokens', async () => {
      // Mock transaction request for token transfer
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockTokenAddress as `0x${string}`,
        value: '0',
        data: '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890abcdef120000000000000000000000000000000000000000000000000000000000000001', // transfer(to, amount)
        nonce: 0,
        gasLimit: '100000',
        status: 'pending'
      };

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn().mockResolvedValue(mockTxHash),
        getAddresses: jest.fn().mockResolvedValue([mockFromAddress])
      };

      // Mock public client
      const mockPublicClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue({
          hash: mockTxHash,
          status: 'success',
          blockNumber: 123456n,
          logs: [{
            address: mockTokenAddress,
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
              `0x000000000000000000000000${mockFromAddress.slice(2)}`,
              `0x000000000000000000000000${mockToAddress.slice(2)}`
            ],
            data: '0x0000000000000000000000000000000000000000000000000000000000000001'
          }]
        }),
        estimateGas: jest.fn().mockResolvedValue(100000n),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Send token transaction
      const txHash = await transactionManager.sendTransaction(txRequest);
      expect(txHash).toBe(mockTxHash);

      // Verify transaction was successful
      const receipt = await monitor.getTransactionReceipt(txHash as `0x${string}`);
      expect(receipt?.status).toBe('success');
      expect(receipt?.logs[0].address).toBe(mockTokenAddress);
    });

    it('should handle token approval', async () => {
      // Mock transaction request for token approval
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockTokenAddress as `0x${string}`,
        value: '0',
        data: '0x095ea7b3000000000000000000000000abcdef1234567890abcdef1234567890abcdef120000000000000000000000000000000000000000000000000000000000000001', // approve(spender, amount)
        nonce: 0,
        gasLimit: '100000',
        status: 'pending'
      };

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn().mockResolvedValue(mockTxHash),
        getAddresses: jest.fn().mockResolvedValue([mockFromAddress])
      };

      // Mock public client
      const mockPublicClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue({
          hash: mockTxHash,
          status: 'success',
          blockNumber: 123456n,
          logs: [{
            address: mockTokenAddress,
            topics: [
              '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', // Approval event
              `0x000000000000000000000000${mockFromAddress.slice(2)}`,
              `0x000000000000000000000000${mockToAddress.slice(2)}`
            ],
            data: '0x0000000000000000000000000000000000000000000000000000000000000001'
          }]
        }),
        estimateGas: jest.fn().mockResolvedValue(100000n),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Send approval transaction
      const txHash = await transactionManager.sendTransaction(txRequest);
      expect(txHash).toBe(mockTxHash);

      // Verify transaction was successful
      const receipt = await monitor.getTransactionReceipt(txHash as `0x${string}`);
      expect(receipt?.status).toBe('success');
      expect(receipt?.logs[0].address).toBe(mockTokenAddress);
    });
  });

  describe('Transaction Cancellation', () => {
    it('should successfully cancel a pending transaction', async () => {
      const pendingTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      
      // Mock transaction request for cancellation
      const txRequest: TransactionRequest = {
        from: mockFromAddress as `0x${string}`,
        to: mockFromAddress as `0x${string}`,
        value: '0',
        data: '0x',
        nonce: 0,
        gasLimit: '21000',
        status: 'pending'
      };

      // Mock wallet client
      const mockWalletClient = {
        sendTransaction: jest.fn()
          .mockResolvedValueOnce(pendingTxHash) // Original transaction
          .mockResolvedValueOnce(mockTxHash), // Cancellation transaction
        getAddresses: jest.fn().mockResolvedValue([mockFromAddress])
      };

      // Mock public client
      const mockPublicClient = {
        getTransactionReceipt: jest.fn()
          .mockResolvedValueOnce(null) // Original transaction still pending
          .mockResolvedValueOnce({
            hash: mockTxHash,
            status: 'success',
            blockNumber: 123456n
          }),
        getTransactionCount: jest.fn().mockResolvedValue(1n),
        estimateGas: jest.fn().mockResolvedValue(21000n),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createWalletClient as jest.Mock).mockReturnValue(mockWalletClient);
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Send original transaction
      const originalTxHash = await transactionManager.sendTransaction(txRequest);
      expect(originalTxHash).toBe(pendingTxHash);

      // Cancel transaction
      const cancelTxHash = await transactionManager.cancelTransaction(pendingTxHash as `0x${string}`, mockFromAddress as `0x${string}`, 1);
      expect(cancelTxHash).toBe(mockTxHash);

      // Verify cancellation was successful
      const receipt = await monitor.getTransactionReceipt(cancelTxHash as `0x${string}`);
      expect(receipt?.status).toBe('success');
    });

    it('should handle cancellation failure', async () => {
      const pendingTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      
      // Mock public client
      const mockPublicClient = {
        getTransactionCount: jest.fn().mockRejectedValue(new Error('Failed to get nonce')),
        estimateGas: jest.fn().mockResolvedValue(21000n),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n)
      };

      // Setup mocks
      (createPublicClient as jest.Mock).mockReturnValue(mockPublicClient);

      // Attempt cancellation
      await expect(transactionManager.cancelTransaction(pendingTxHash as `0x${string}`, mockFromAddress as `0x${string}`, 1))
        .rejects
        .toThrow('Failed to get nonce');
    });
  });
}); 