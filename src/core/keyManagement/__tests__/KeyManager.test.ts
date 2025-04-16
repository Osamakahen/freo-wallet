/// <reference types="jest" />

import { KeyManager } from '../KeyManager';
import { generateMnemonic, validateMnemonic } from '../../../utils/crypto';
import { mnemonicToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Mock the crypto utils
jest.mock('../../../utils/crypto', () => ({
  generateMnemonic: jest.fn(),
  validateMnemonic: jest.fn(),
}));

// Mock viem
jest.mock('viem/accounts', () => ({
  mnemonicToAccount: jest.fn(),
}));

jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn(),
}));

jest.mock('viem/chains', () => ({
  mainnet: {},
}));

describe('KeyManager', () => {
  let keyManager: KeyManager;
  const mockMnemonic = 'test test test test test test test test test test test junk';
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const mockPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234' as `0x${string}`;
  const mockPassword = 'test-password';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (generateMnemonic as jest.Mock).mockReturnValue(mockMnemonic);
    (validateMnemonic as jest.Mock).mockReturnValue(true);
    (mnemonicToAccount as jest.Mock).mockReturnValue({
      address: mockAddress,
      getHdKey: () => ({
        privateKey: Buffer.from(mockPrivateKey.slice(2), 'hex')
      })
    });
    (createPublicClient as jest.Mock).mockReturnValue({
      chain: mainnet,
      transport: http()
    });

    keyManager = new KeyManager();
  });

  describe('initialization', () => {
    it('should initialize with no wallet', async () => {
      expect(keyManager.getAccounts()).toHaveLength(0);
      await expect(keyManager.getActiveAccount()).rejects.toThrow('Wallet not initialized or locked');
    });

    it('should setup wallet with mnemonic', async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
      expect(mnemonicToAccount).toHaveBeenCalledWith(mockMnemonic);
      expect(keyManager.getAccounts()).toHaveLength(1);
    });

    it('should throw error for invalid mnemonic', async () => {
      await expect(keyManager.setup(mockPassword, 'invalid mnemonic'))
        .rejects
        .toThrow('Invalid mnemonic');
    });
  });

  describe('account management', () => {
    beforeEach(async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
    });

    it('should get active account', async () => {
      const account = await keyManager.getActiveAccount();
      expect(account.address).toBe(mockAddress);
      expect(account.privateKey).toBe(mockPrivateKey);
    });

    it('should get address', async () => {
      const address = await keyManager.getAddress();
      expect(address).toBe(mockAddress);
    });

    it('should throw error for invalid account index', async () => {
      await expect(keyManager.deriveAccount(1))
        .rejects
        .toThrow('Only first account is supported');
    });
  });

  describe('signing operations', () => {
    beforeEach(async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
    });

    it('should sign message', async () => {
      const message = 'Hello, World!';
      const signature = await keyManager.signMessage(message);
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should sign transaction', async () => {
      const transaction = {
        from: mockAddress,
        to: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        value: '1000000000000000000', // 1 ETH
        gasLimit: '21000',
        maxFeePerGas: '20000000000',
        maxPriorityFeePerGas: '1000000000'
      };
      const signedTx = await keyManager.signTransaction(transaction);
      expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);
    });

    it('should throw error when signing without initialized wallet', async () => {
      const newKeyManager = new KeyManager();
      await expect(newKeyManager.signMessage('test'))
        .rejects
        .toThrow('Wallet not initialized or locked');
    });
  });

  describe('security', () => {
    it('should lock wallet', async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
      await keyManager.lock();
      await expect(keyManager.getActiveAccount())
        .rejects
        .toThrow('Wallet not initialized or locked');
    });

    it('should unlock wallet with correct password', async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
      await keyManager.lock();
      await keyManager.unlock(mockPassword);
      const account = await keyManager.getActiveAccount();
      expect(account.address).toBe(mockAddress);
    });

    it('should throw error for invalid password', async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
      await keyManager.lock();
      await expect(keyManager.unlock('wrong-password'))
        .rejects
        .toThrow('Invalid password');
    });
  });

  describe('error handling', () => {
    it('should handle failed private key derivation', async () => {
      (mnemonicToAccount as jest.Mock).mockReturnValueOnce({
        address: mockAddress,
        getHdKey: () => ({
          privateKey: null
        })
      });

      await expect(keyManager.setup(mockPassword, mockMnemonic))
        .rejects
        .toThrow('Failed to derive private key');
    });

    it('should handle invalid transaction parameters', async () => {
      await keyManager.setup(mockPassword, mockMnemonic);
      const invalidTransaction = {
        from: mockAddress,
        to: 'invalid-address' as `0x${string}`,
        value: 'invalid-value'
      };

      await expect(keyManager.signTransaction(invalidTransaction))
        .rejects
        .toThrow();
    });
  });
}); 