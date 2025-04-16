import { describe, expect, it, jest } from '@jest/globals';
import { HardwareWalletManager } from '../HardwareWalletManager';
import { WalletError } from '../../error/ErrorHandler';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

describe('HardwareWalletManager', () => {
  let hardwareWalletManager: HardwareWalletManager;

  beforeEach(() => {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });

    hardwareWalletManager = new HardwareWalletManager(publicClient);
  });

  describe('connect', () => {
    it('should connect to a hardware wallet', async () => {
      const address = await hardwareWalletManager.connect('ledger');

      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should throw error for unsupported wallet type', async () => {
      await expect(
        hardwareWalletManager.connect('unsupported' as any)
      ).rejects.toThrow('Unsupported hardware wallet type');
    });
  });

  describe('getDeviceInfo', () => {
    it('should get device info for ledger', async () => {
      const info = await hardwareWalletManager.getDeviceInfo('ledger');

      expect(info).toBeDefined();
      expect(info.type).toBe('ledger');
      expect(info.model).toBe('Nano X');
      expect(info.firmware).toBe('2.1.0');
    });

    it('should get device info for trezor', async () => {
      const info = await hardwareWalletManager.getDeviceInfo('trezor');

      expect(info).toBeDefined();
      expect(info.type).toBe('trezor');
      expect(info.model).toBe('Trezor Model T');
      expect(info.firmware).toBe('2.5.3');
    });
  });

  describe('signTransaction', () => {
    it('should sign a transaction', async () => {
      const tx = {
        to: '0x0987654321098765432109876543210987654321',
        value: BigInt(1000000000000000),
        data: '0x'
      };

      const signature = await hardwareWalletManager.signTransaction(tx);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });
  });

  describe('signMessage', () => {
    it('should sign a message', async () => {
      const message = 'Hello, World!';
      const signature = await hardwareWalletManager.signMessage(message);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });
  });
}); 