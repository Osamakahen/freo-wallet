import { TransactionMonitor } from '../TransactionMonitor';
import { createPublicClient } from 'viem';

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
}));

jest.mock('viem/chains', () => ({
  mainnet: {},
}));

describe('TransactionMonitor', () => {
  let monitor: TransactionMonitor;
  const mockTxHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const mockReceipt = {
    status: 'success',
    blockNumber: 123456,
    transactionHash: mockTxHash,
    from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    to: '0x0987654321098765432109876543210987654321' as `0x${string}`,
    contractAddress: null,
    logs: [],
    logsBloom: '0x',
    gasUsed: '21000',
    effectiveGasPrice: '20000000000',
    cumulativeGasUsed: '21000',
    type: '0x2'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createPublicClient as jest.Mock).mockReturnValue({
      getTransactionReceipt: jest.fn(),
      getTransaction: jest.fn()
    });
    monitor = new TransactionMonitor();
  });

  describe('monitorTransaction', () => {
    it('should start monitoring a transaction', async () => {
      const onStatusChange = jest.fn();
      const client = (createPublicClient as jest.Mock)();
      
      client.getTransactionReceipt.mockResolvedValueOnce(mockReceipt);
      
      await monitor.monitorTransaction(mockTxHash, onStatusChange);
      
      expect(onStatusChange).toHaveBeenCalledWith('pending');
      expect(onStatusChange).toHaveBeenCalledWith('confirmed');
    });

    it('should handle failed transactions', async () => {
      const onStatusChange = jest.fn();
      const client = (createPublicClient as jest.Mock)();
      
      client.getTransactionReceipt.mockResolvedValueOnce({
        ...mockReceipt,
        status: 'reverted'
      });
      
      await monitor.monitorTransaction(mockTxHash, onStatusChange);
      
      expect(onStatusChange).toHaveBeenCalledWith('pending');
      expect(onStatusChange).toHaveBeenCalledWith('failed');
    });

    it('should handle monitoring errors', async () => {
      const onStatusChange = jest.fn();
      const client = (createPublicClient as jest.Mock)();
      
      client.getTransactionReceipt.mockRejectedValueOnce(new Error('Network error'));
      
      await monitor.monitorTransaction(mockTxHash, onStatusChange);
      
      expect(onStatusChange).toHaveBeenCalledWith('pending');
      expect(onStatusChange).toHaveBeenCalledWith('failed');
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring a transaction', async () => {
      const onStatusChange = jest.fn();
      await monitor.monitorTransaction(mockTxHash, onStatusChange);
      
      monitor.stopMonitoring(mockTxHash);
      
      expect(monitor.isMonitoring(mockTxHash)).toBe(false);
    });
  });

  describe('getTransactionStatus', () => {
    it('should return null for non-monitored transactions', () => {
      expect(monitor.getTransactionStatus(mockTxHash)).toBeNull();
    });

    it('should return pending for monitored transactions', async () => {
      const onStatusChange = jest.fn();
      await monitor.monitorTransaction(mockTxHash, onStatusChange);
      
      expect(monitor.getTransactionStatus(mockTxHash)).toBe('pending');
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return transaction receipt', async () => {
      const client = (createPublicClient as jest.Mock)();
      client.getTransactionReceipt.mockResolvedValueOnce(mockReceipt);
      
      const receipt = await monitor.getTransactionReceipt(mockTxHash);
      
      expect(receipt).toEqual(mockReceipt);
    });

    it('should return null for non-existent transactions', async () => {
      const client = (createPublicClient as jest.Mock)();
      client.getTransactionReceipt.mockResolvedValueOnce(null);
      
      const receipt = await monitor.getTransactionReceipt(mockTxHash);
      
      expect(receipt).toBeNull();
    });
  });

  describe('getTransactionDetails', () => {
    it('should return transaction details', async () => {
      const mockTx = {
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        to: '0x0987654321098765432109876543210987654321' as `0x${string}`,
        value: 1000000000000000000n,
        data: '0x',
        gas: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 1000000000n,
        nonce: 1
      };
      
      const client = (createPublicClient as jest.Mock)();
      client.getTransaction.mockResolvedValueOnce(mockTx);
      
      const details = await monitor.getTransactionDetails(mockTxHash);
      
      expect(details).toEqual({
        from: mockTx.from,
        to: mockTx.to,
        value: '1000000000000000000',
        data: '0x',
        gasLimit: '21000',
        maxFeePerGas: '20000000000',
        maxPriorityFeePerGas: '1000000000',
        nonce: 1,
        hash: mockTxHash,
        status: 'pending'
      });
    });

    it('should return null for non-existent transactions', async () => {
      const client = (createPublicClient as jest.Mock)();
      client.getTransaction.mockResolvedValueOnce(null);
      
      const details = await monitor.getTransactionDetails(mockTxHash);
      
      expect(details).toBeNull();
    });
  });
}); 