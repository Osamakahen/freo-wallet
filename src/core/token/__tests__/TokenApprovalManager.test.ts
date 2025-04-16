import { TokenApprovalManager } from '../TokenApprovalManager';
import { createWalletClient } from 'viem';
import { WebSocketTransactionMonitor } from '../../transaction/WebSocketTransactionMonitor';

// Mock viem functions
jest.mock('viem', () => ({
  createWalletClient: jest.fn(),
  custom: jest.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

// Mock WebSocketTransactionMonitor
jest.mock('../../transaction/WebSocketTransactionMonitor', () => ({
  WebSocketTransactionMonitor: jest.fn().mockImplementation(() => ({
    monitorTransaction: jest.fn(),
    subscribe: jest.fn().mockReturnValue(() => {})
  }))
}));

describe('TokenApprovalManager', () => {
  let approvalManager: TokenApprovalManager;
  const mockTokenAddress = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;
  const mockSpender = '0xabcdef1234567890abcdef1234567890abcdef12' as `0x${string}`;
  const mockOwner = '0x1111111111111111111111111111111111111111' as `0x${string}`;
  const mockTokenMetadata = {
    address: mockTokenAddress,
    name: 'Test Token',
    symbol: 'TEST',
    decimals: 18
  };

  beforeEach(() => {
    jest.clearAllMocks();
    approvalManager = new TokenApprovalManager();
  });

  describe('checkApproval', () => {
    it('should return approval status when allowance is greater than 0', async () => {
      const mockAllowance = BigInt('1000000000000000000'); // 1 token

      (createWalletClient as jest.Mock).mockReturnValue({
        readContract: jest.fn().mockResolvedValue(mockAllowance)
      });

      const status = await approvalManager.checkApproval(mockTokenAddress, mockOwner, mockSpender);

      expect(status).toEqual({
        isApproved: true,
        approvedAmount: '1.0',
        requiredAmount: '0'
      });
    });

    it('should return not approved when allowance is 0', async () => {
      const mockAllowance = BigInt(0);

      (createWalletClient as jest.Mock).mockReturnValue({
        readContract: jest.fn().mockResolvedValue(mockAllowance)
      });

      const status = await approvalManager.checkApproval(mockTokenAddress, mockOwner, mockSpender);

      expect(status).toEqual({
        isApproved: false,
        approvedAmount: '0.0',
        requiredAmount: '0'
      });
    });
  });

  describe('approveToken', () => {
    it('should approve token with specified amount and start monitoring', async () => {
      const mockAmount = '1.5';
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

      (createWalletClient as jest.Mock).mockReturnValue({
        writeContract: jest.fn().mockResolvedValue(mockHash)
      });

      const transaction = await approvalManager.approveToken({
        tokenAddress: mockTokenAddress,
        spender: mockSpender,
        amount: mockAmount,
        tokenMetadata: mockTokenMetadata
      });

      expect(transaction).toEqual({
        hash: mockHash,
        status: 'pending',
        timestamp: expect.any(Number)
      });

      expect(WebSocketTransactionMonitor).toHaveBeenCalled();
    });
  });

  describe('approveMaxToken', () => {
    it('should approve max token amount and start monitoring', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

      (createWalletClient as jest.Mock).mockReturnValue({
        writeContract: jest.fn().mockResolvedValue(mockHash)
      });

      const transaction = await approvalManager.approveMaxToken({
        tokenAddress: mockTokenAddress,
        spender: mockSpender,
        amount: '0', // Not used for max approval
        tokenMetadata: mockTokenMetadata
      });

      expect(transaction).toEqual({
        hash: mockHash,
        status: 'pending',
        timestamp: expect.any(Number)
      });

      expect(WebSocketTransactionMonitor).toHaveBeenCalled();
    });
  });

  describe('revokeApproval', () => {
    it('should revoke token approval and start monitoring', async () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

      (createWalletClient as jest.Mock).mockReturnValue({
        writeContract: jest.fn().mockResolvedValue(mockHash)
      });

      const transaction = await approvalManager.revokeApproval(mockTokenAddress, mockSpender);

      expect(transaction).toEqual({
        hash: mockHash,
        status: 'pending',
        timestamp: expect.any(Number)
      });

      expect(WebSocketTransactionMonitor).toHaveBeenCalled();
    });
  });

  describe('subscribeToTransactionUpdates', () => {
    it('should subscribe to transaction updates', () => {
      const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;
      const mockCallback = jest.fn();

      const unsubscribe = approvalManager.subscribeToTransactionUpdates(mockHash, mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(WebSocketTransactionMonitor).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors in checkApproval', async () => {
      (createWalletClient as jest.Mock).mockReturnValue({
        readContract: jest.fn().mockRejectedValue(new Error('Contract read failed'))
      });

      await expect(approvalManager.checkApproval(mockTokenAddress, mockOwner, mockSpender))
        .rejects.toThrow('Failed to check token approval status');
    });

    it('should handle errors in approveToken', async () => {
      (createWalletClient as jest.Mock).mockReturnValue({
        writeContract: jest.fn().mockRejectedValue(new Error('Contract write failed'))
      });

      await expect(approvalManager.approveToken({
        tokenAddress: mockTokenAddress,
        spender: mockSpender,
        amount: '1.0',
        tokenMetadata: mockTokenMetadata
      })).rejects.toThrow('Failed to approve token');
    });
  });
}); 