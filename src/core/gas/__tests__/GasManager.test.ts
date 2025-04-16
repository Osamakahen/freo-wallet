import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GasManager } from '../GasManager';

// Mock viem functions
vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
  http: vi.fn(),
  mainnet: { id: 1, name: 'mainnet' }
}));

describe('GasManager', () => {
  let gasManager: GasManager;

  beforeEach(() => {
    gasManager = new GasManager('https://mainnet.infura.io/v3/your-api-key');
  });

  describe('getCurrentGasPrice', () => {
    it('should return current gas price', async () => {
      const gasPrice = await gasManager.getCurrentGasPrice();
      expect(gasPrice).toBeDefined();
      expect(gasPrice.slow).toBeDefined();
      expect(gasPrice.standard).toBeDefined();
      expect(gasPrice.fast).toBeDefined();
      expect(gasPrice.timestamp).toBeDefined();
    });
  });

  describe('getGasEstimate', () => {
    it('should estimate gas for a transaction', async () => {
      const estimate = await gasManager.getGasEstimate(
        '0x1234567890abcdef1234567890abcdef12345678',
        '0x0987654321098765432109876543210987654321',
        '1000000000000000'
      );
      expect(estimate).toBeDefined();
      expect(estimate.gasLimit).toBeDefined();
      expect(estimate.maxFeePerGas).toBeDefined();
      expect(estimate.maxPriorityFeePerGas).toBeDefined();
    });
  });

  describe('getGasHistory', () => {
    it('should return gas price history', async () => {
      const history = await gasManager.getGasHistory(10);
      expect(history).toBeDefined();
      expect(history.prices).toBeDefined();
      expect(history.prices.length).toBeLessThanOrEqual(10);
      expect(history.average).toBeDefined();
      expect(history.average.slow).toBeDefined();
      expect(history.average.standard).toBeDefined();
      expect(history.average.fast).toBeDefined();
    });
  });

  describe('getOptimalGasSettings', () => {
    it('should return optimal gas settings', async () => {
      const settings = await gasManager.getOptimalGasSettings(
        '0x1234567890abcdef1234567890abcdef12345678',
        '0x0987654321098765432109876543210987654321',
        '1000000000000000'
      );
      expect(settings).toBeDefined();
      expect(settings.gasLimit).toBeDefined();
      expect(settings.maxFeePerGas).toBeDefined();
      expect(settings.maxPriorityFeePerGas).toBeDefined();
    });
  });

  describe('simulateTransaction', () => {
    it('should simulate a transaction', async () => {
      const result = await gasManager.simulateTransaction(
        '0x1234567890abcdef1234567890abcdef12345678',
        '0x0987654321098765432109876543210987654321',
        '1000000000000000',
        '0x',
        {
          gasLimit: '21000',
          maxFeePerGas: '10000000000',
          maxPriorityFeePerGas: '1000000000'
        }
      );
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.gasUsed).toBeDefined();
    });
  });
}); 