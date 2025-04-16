import { WebSocketTransactionMonitor } from '../WebSocketTransactionMonitor';
import { createPublicClient, webSocket } from 'viem';
import { TransactionReceipt } from '../../../types/wallet';

// Mock viem functions
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  webSocket: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

describe('WebSocketTransactionMonitor', () => {
  let monitor: WebSocketTransactionMonitor;
  const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockReceipt: TransactionReceipt = {
    hash: mockTxHash,
    status: 'success',
    blockNumber: 123456,
    blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    transactionIndex: 0,
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    logs: [],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    gasUsed: '21000',
    effectiveGasPrice: '1000000000',
    cumulativeGasUsed: '21000',
    contractAddress: null,
    type: '0x0'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new monitor instance
    monitor = new WebSocketTransactionMonitor();
  });

  describe('monitorTransaction', () => {
    it('should set up WebSocket monitoring for a transaction', async () => {
      const onUpdate = jest.fn();
      
      await monitor.monitorTransaction(mockTxHash as `0x${string}`, onUpdate);
      
      // Verify WebSocket client was created
      expect(webSocket).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_ETHEREUM_WS_URL);
      expect(createPublicClient).toHaveBeenCalled();
    });

    it('should call onUpdate when transaction status changes', async () => {
      const onUpdate = jest.fn();
      const mockClient = {
        watchBlocks: jest.fn().mockImplementation(({ onBlock }) => {
          // Simulate block arrival
          onBlock({ number: 123456n });
        }),
        getTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt)
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      await monitor.monitorTransaction(mockTxHash as `0x${string}`, onUpdate);

      // Verify onUpdate was called with receipt
      expect(onUpdate).toHaveBeenCalledWith(mockReceipt);
    });

    it('should handle errors during monitoring', async () => {
      const onUpdate = jest.fn();
      const mockClient = {
        watchBlocks: jest.fn().mockImplementation(() => {
          throw new Error('WebSocket error');
        })
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      await expect(
        monitor.monitorTransaction(mockTxHash as `0x${string}`, onUpdate)
      ).rejects.toThrow('Failed to monitor transaction');
    });
  });

  describe('stopMonitoring', () => {
    it('should remove subscription for a transaction', () => {
      const onUpdate = jest.fn();
      monitor.monitorTransaction(mockTxHash as `0x${string}`, onUpdate);
      
      monitor.stopMonitoring(mockTxHash as `0x${string}`);
      
      // Verify subscription was removed
      expect(monitor['subscriptions'].has(mockTxHash)).toBe(false);
    });
  });

  describe('getTransactionStatus', () => {
    it('should return transaction status', async () => {
      const mockClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt)
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      const status = await monitor.getTransactionStatus(mockTxHash as `0x${string}`);
      expect(status).toBe('success');
    });

    it('should return null for non-existent transaction', async () => {
      const mockClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue(null)
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      const status = await monitor.getTransactionStatus(mockTxHash as `0x${string}`);
      expect(status).toBeNull();
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return transaction receipt', async () => {
      const mockClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt)
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      const receipt = await monitor.getTransactionReceipt(mockTxHash as `0x${string}`);
      expect(receipt).toEqual(mockReceipt);
    });

    it('should return null for non-existent transaction', async () => {
      const mockClient = {
        getTransactionReceipt: jest.fn().mockResolvedValue(null)
      };

      (createPublicClient as jest.Mock).mockReturnValue(mockClient);

      const receipt = await monitor.getTransactionReceipt(mockTxHash as `0x${string}`);
      expect(receipt).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clear all subscriptions', () => {
      const onUpdate = jest.fn();
      monitor.monitorTransaction(mockTxHash as `0x${string}`, onUpdate);
      
      monitor.destroy();
      
      expect(monitor['subscriptions'].size).toBe(0);
    });
  });
}); 