import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SecurityService } from '../services/SecurityService';
import useWalletStore from '../store/wallet';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { ChainConfig, TransactionRequest, TransactionReceipt } from '../types/wallet';
import { generateMnemonic, validateMnemonic } from '../utils/crypto';
import { type EthereumProvider } from '../types/ethereum';
import { type Address } from 'viem';
import { mainnet } from 'viem/chains';

// Mock window.ethereum with proper types
const mockEthereum = {
  request: jest.fn(async (args: { method: string; params?: unknown[] }): Promise<unknown> => {
    return undefined;
  }),
  on: jest.fn(),
  removeListener: jest.fn(),
  selectedAddress: null,
  chainId: null
} as unknown as EthereumProvider;

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

// Mock localStorage with all required properties
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
} as unknown as Storage;

global.localStorage = localStorageMock;

describe('Wallet Tests', () => {
  let securityService: SecurityService;
  let keyManager: KeyManager;
  let txManager: TransactionManager;

  const mockAddress: Address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address;
  const mockNetwork: ChainConfig = {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id'
  };
  const testPassword = 'testPassword123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useWalletStore.setState({
      address: mockAddress,
      isConnected: false,
      balance: '0'
    });

    securityService = SecurityService.getInstance();
    keyManager = new KeyManager();
    txManager = new TransactionManager(mockNetwork.rpcUrl, keyManager);
  });

  describe('Transaction Management', () => {
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(testPassword, mnemonic);
      await keyManager.unlock(testPassword);
    });

    it('should prepare transaction with correct parameters', async () => {
      const mockTransaction: TransactionRequest = {
        from: mockAddress,
        to: mockAddress,
        value: '1000000000000000000',
        data: '0x' as `0x${string}`
      };

      const tx = await txManager.sendTransaction(mockTransaction);
      expect(tx).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should track transaction status', async () => {
      const mockTxHash = '0x123' as `0x${string}`;
      const mockTxReceipt: TransactionReceipt = {
        hash: mockTxHash,
        status: 'confirmed',
        blockNumber: 12345,
        blockHash: '0x789' as `0x${string}`,
        transactionIndex: 1,
        from: mockAddress,
        to: '0x456' as Address,
        contractAddress: null,
        logs: [],
        logsBloom: '0x0',
        gasUsed: '21000',
        effectiveGasPrice: '20000000000',
        cumulativeGasUsed: '21000',
        type: '0x2',
        timestamp: Date.now(),
        value: '1000000000000000000'
      };

      (mockEthereum.request as jest.Mock).mockResolvedValueOnce(mockTxReceipt);

      const receipt = await txManager.getTransactionReceipt(mockTxHash);
      expect(receipt).toBeDefined();
      if (receipt) {
        expect(receipt.hash).toBe(mockTxReceipt.hash);
        expect(receipt.status).toBe(mockTxReceipt.status);
      }
    });
  });

  describe('Security Tests', () => {
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(testPassword, mnemonic);
    });

    it('should lock and unlock wallet', async () => {
      await keyManager.unlock(testPassword);
      const address = await keyManager.getAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);

      await keyManager.lock();
      await expect(keyManager.getAddress()).rejects.toThrow('Wallet not initialized or locked');
    });

    it('should expire session after timeout', () => {
      securityService.updateActivity();
      jest.advanceTimersByTime(31 * 60 * 1000); // 31 minutes
      expect(securityService.isSessionExpired()).toBe(true);
    });

    it('should validate transaction security', async () => {
      const mockTransaction = {
        to: mockAddress,
        value: '1000000000000000000',
        data: '0x' as `0x${string}`
      };

      const isValid = await securityService.validateTransaction();
      expect(isValid).toBe(true);
    });
  });

  describe('Account Management', () => {
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(testPassword, mnemonic);
    });

    it('should derive multiple accounts', async () => {
      const account1 = await keyManager.deriveAccount(0);
      const account2 = await keyManager.deriveAccount(1);
      
      expect(account1).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(account2).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should manage active account', async () => {
      const account1 = await keyManager.deriveAccount(0);
      await keyManager.deriveAccount(1);
      
      const activeAccount = await keyManager.getActiveAccount();
      expect(activeAccount.address).toBe(account1);
    });

    it('should throw error for invalid active account', () => {
      expect(() => keyManager.getActiveAccount())
        .toThrow('Wallet not initialized or locked');
    });
  });

  describe('Message Signing', () => {
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(testPassword, mnemonic);
    });

    it('should sign messages with correct format', async () => {
      const message = 'Hello, World!';
      const signature = await keyManager.signMessage(message);
      
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should throw error when signing without wallet', async () => {
      const newKeyManager = new KeyManager();
      await expect(newKeyManager.signMessage('test'))
        .rejects
        .toThrow('Wallet not initialized');
    });
  });
});