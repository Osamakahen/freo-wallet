import { TransactionHistory } from '../TransactionHistory';
import { createPublicClient } from 'viem';

// Mock viem functions
jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

describe('TransactionHistory', () => {
  let transactionHistory: TransactionHistory;
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    jest.clearAllMocks();
    transactionHistory = new TransactionHistory();
  });

  describe('getTransactionHistory', () => {
    it('should fetch transaction history', async () => {
      const mockLogs = [
        {
          transactionHash: '0x123',
          blockNumber: BigInt(1000),
          from: mockAddress,
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: BigInt('1000000000000000000'),
          gasUsed: BigInt('21000'),
          effectiveGasPrice: BigInt('20000000000'),
          status: 'success',
          logs: []
        }
      ];

      (createPublicClient as jest.Mock).mockReturnValue({
        getLogs: jest.fn().mockResolvedValue(mockLogs),
        getTransactionReceipt: jest.fn().mockResolvedValue(mockLogs[0]),
        getBlockNumber: jest.fn().mockResolvedValue(BigInt(2000))
      });

      const transactions = await transactionHistory.getTransactionHistory(
        mockAddress as `0x${string}`
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        hash: '0x123',
        status: 'success',
        blockNumber: BigInt(1000),
        from: mockAddress,
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasUsed: '21000',
        effectiveGasPrice: '20000000000',
        logs: []
      });
    });
  });

  describe('getTransactionAnalytics', () => {
    it('should calculate transaction analytics', async () => {
      const mockTransactions = [
        {
          hash: '0x123',
          status: 'success',
          blockNumber: BigInt(1000),
          from: mockAddress,
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000',
          gasUsed: '21000',
          effectiveGasPrice: '20000000000',
          logs: []
        },
        {
          hash: '0x456',
          status: 'reverted',
          blockNumber: BigInt(1001),
          from: mockAddress,
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '2000000000000000000',
          gasUsed: '21000',
          effectiveGasPrice: '20000000000',
          logs: []
        }
      ];

      (createPublicClient as jest.Mock).mockReturnValue({
        getLogs: jest.fn().mockResolvedValue(mockTransactions),
        getTransactionReceipt: jest.fn().mockImplementation(({ hash }) =>
          mockTransactions.find(tx => tx.hash === hash)
        ),
        getBlockNumber: jest.fn().mockResolvedValue(BigInt(2000))
      });

      const analytics = await transactionHistory.getTransactionAnalytics(
        mockAddress as `0x${string}`,
        'month'
      );

      expect(analytics).toEqual({
        totalTransactions: 2,
        successfulTransactions: 1,
        failedTransactions: 1,
        totalGasUsed: '42000',
        averageGasPrice: '20000000000',
        transactionVolume: '3000000000000000000',
        mostActiveTime: expect.any(Object),
        topRecipients: expect.any(Array)
      });
    });
  });

  describe('helper methods', () => {
    it('should calculate time ranges correctly', () => {
      const ranges = (transactionHistory as any).createBlockRanges(
        BigInt(1000),
        BigInt(1020)
      );

      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toEqual({
        start: BigInt(1000),
        end: BigInt(1020)
      });
    });

    it('should calculate average gas price correctly', () => {
      const transactions = [
        { effectiveGasPrice: '10000000000' },
        { effectiveGasPrice: '20000000000' }
      ];

      const average = (transactionHistory as any).calculateAverageGasPrice(transactions);
      expect(average).toBe('15000000000');
    });

    it('should calculate transaction volume correctly', () => {
      const transactions = [
        { value: '1000000000000000000' },
        { value: '2000000000000000000' }
      ];

      const volume = (transactionHistory as any).calculateTransactionVolume(transactions);
      expect(volume).toBe('3000000000000000000');
    });
  });
}); 