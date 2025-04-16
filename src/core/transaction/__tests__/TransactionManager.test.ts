import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionManager } from '../TransactionManager';
import { createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';

describe('TransactionManager', () => {
  let transactionManager: TransactionManager;
  const mockAddress = '0x1234567890123456789012345678901234567890' as Address;
  const mockToAddress = '0x0987654321098765432109876543210987654321' as Address;

  beforeEach(() => {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });

    transactionManager = new TransactionManager(publicClient);
  });

  describe('getTransactionHistory', () => {
    it('should fetch transaction history for an address', async () => {
      const history = await transactionManager.getTransactionHistory(mockAddress, 5);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      history.forEach(tx => {
        expect(tx).toHaveProperty('hash');
        expect(tx).toHaveProperty('from');
        expect(tx).toHaveProperty('to');
        expect(tx).toHaveProperty('value');
        expect(tx).toHaveProperty('status');
      });
    });

    it('should respect the limit parameter', async () => {
      const limit = 3;
      const history = await transactionManager.getTransactionHistory(mockAddress, limit);

      expect(history.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for a transaction', async () => {
      const tx = {
        to: mockToAddress,
        value: BigInt(1000000000000000), // 0.001 ETH
        data: '0x'
      };

      const estimate = await transactionManager.estimateGas(tx);

      expect(estimate).toBeDefined();
      expect(estimate).toHaveProperty('gasLimit');
      expect(estimate).toHaveProperty('maxFeePerGas');
      expect(estimate).toHaveProperty('maxPriorityFeePerGas');
      expect(Number(estimate.gasLimit)).toBeGreaterThan(0);
    });
  });

  describe('simulateTransaction', () => {
    it('should simulate a transaction successfully', async () => {
      const tx = {
        to: mockToAddress,
        value: BigInt(1000000000000000),
        data: '0x'
      };

      const result = await transactionManager.simulateTransaction(tx);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.gasUsed).toBeDefined();
      expect(Number(result.gasUsed)).toBeGreaterThan(0);
    });

    it('should handle failed transaction simulation', async () => {
      const tx = {
        to: mockToAddress,
        value: BigInt(1000000000000000000000000), // Unrealistic amount
        data: '0x'
      };

      const result = await transactionManager.simulateTransaction(tx);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getTransactionReceipt', () => {
    it('should fetch transaction receipt for a valid hash', async () => {
      // This test requires a valid transaction hash
      const mockTxHash = '0x123...'; // Replace with a real transaction hash
      const receipt = await transactionManager.getTransactionReceipt(mockTxHash);

      expect(receipt).toBeDefined();
      expect(receipt).toHaveProperty('transactionHash');
      expect(receipt).toHaveProperty('status');
      expect(receipt).toHaveProperty('gasUsed');
    });

    it('should handle invalid transaction hash', async () => {
      const invalidHash = '0xinvalid';
      
      await expect(
        transactionManager.getTransactionReceipt(invalidHash)
      ).rejects.toThrow();
    });
  });
}); 