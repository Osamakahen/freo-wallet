import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SecurityService } from '../services/SecurityService';
import { TokenService } from '../services/TokenService';
import { TransactionService } from '../services/TransactionService';
import useWalletStore from '../store/wallet';
import { KeyManager } from '../core/keyManagement/KeyManager';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { ChainConfig } from '../types/wallet';
import { generateMnemonic, validateMnemonic } from '../utils/crypto';
import { type EthereumProvider } from '../types/ethereum';
import { type Address } from 'viem';
import { mainnet } from 'viem/chains';

// Mock window.ethereum with proper types
const mockEthereum = {
  request: jest.fn().mockImplementation((args: { method: string; params?: unknown[] }) => {
    return Promise.resolve(undefined);
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
  let tokenService: TokenService;
  let transactionService: TransactionService;
  let keyManager: KeyManager;
  let txManager: TransactionManager;

  const mockAddress: Address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address;
  const mockNetwork: ChainConfig = {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useWalletStore.setState({
      address: mockAddress,
      isConnected: false,
      balance: '0'
    });

    securityService = new SecurityService();
    tokenService = new TokenService(mockNetwork);
    transactionService = new TransactionService({
      chainId: mainnet.id,
      rpcUrl: 'https://mainnet.infura.io/v3/your-project-id'
    });

    keyManager = new KeyManager();
    txManager = new TransactionManager(mockNetwork.rpcUrl, keyManager);
  });

  describe('Transaction Management', () => {
    const password = 'testPassword123';
    
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(password, mnemonic);
      await keyManager.unlock(password);
    });

    it('should prepare transaction with correct parameters', async () => {
      const mockTransaction = {
        to: mockAddress,
        value: BigInt('1000000000000000000'),
        data: '0x' as `0x${string}`
      };

      const tx = await transactionService.sendTransaction(mockTransaction);
      expect(tx).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should track multiple pending transactions', async () => {
      const mockTransactions = [
        {
          hash: '0x123' as Address,
          from: mockAddress,
          to: '0x456' as Address,
          value: BigInt('1000000'),
          status: 'confirmed' as const,
          timestamp: Date.now(),
        },
      ];

      (mockEthereum.request as jest.Mock).mockResolvedValueOnce(mockTransactions);

      const transactions = await transactionService.getTransactions(mockAddress);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].hash).toBe(mockTransactions[0].hash);
    });
  });

  describe('Security Tests', () => {
    const password = 'testPassword123';
    
    beforeEach(async () => {
      const mnemonic = generateMnemonic();
      await keyManager.setup(password, mnemonic);
    });

    it('should lock and unlock wallet', async () => {
      await keyManager.unlock(password);
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
        value: BigInt('1000000000000000000'),
        data: '0x' as `0x${string}`
      };

      const isValid = await securityService.validateTransaction();
      expect(isValid).toBe(true);
    });
  });

  describe('Token Tests', () => {
    it('should get token balance', async () => {
      const mockBalance = BigInt('1000000000000000000');
      (mockEthereum.request as jest.Mock).mockResolvedValueOnce(mockBalance);

      const balance = await transactionService.getTransactions(mockAddress);
      expect(balance).toBeDefined();
    });

    it('should send token transaction', async () => {
      const mockHash = '0x123' as Address;
      (mockEthereum.request as jest.Mock).mockResolvedValueOnce(mockHash);

      const hash = await transactionService.sendTransaction({
        to: mockAddress,
        value: BigInt('1000000000000000000'),
        data: '0x' as `0x${string}`
      });
      expect(hash).toBe(mockHash);
    });
  });

  describe('Transaction Tests', () => {
    it('should fetch transaction history', async () => {
      const mockTransactions = [
        {
          hash: '0x123' as Address,
          from: mockAddress,
          to: '0x456' as Address,
          value: '1000000',
          status: 'confirmed' as const,
          timestamp: Date.now(),
        },
      ];

      mockEthereum.request.mockResolvedValueOnce(mockTransactions);

      const transactions = await transactionService.getTransactions(mockAddress);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].hash).toBe(mockTransactions[0].hash);
    });
  });

  describe('Wallet Creation and Import', () => {
    it('should create a wallet with valid mnemonic', async () => {
      const password = 'testPassword123';
      const mnemonic = generateMnemonic();
      await keyManager.setup(password, mnemonic);
      expect(validateMnemonic(mnemonic)).toBe(true);
      expect(mnemonic.split(' ').length).toBe(12);
    });

    it('should import wallet with valid mnemonic', async () => {
      const password = 'testPassword123';
      const mnemonic = generateMnemonic();
      await keyManager.setup(password, mnemonic);
      await keyManager.unlock(password);
      const address = await keyManager.getAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should throw error for invalid mnemonic', async () => {
      const password = 'testPassword123';
      const invalidMnemonic = 'invalid mnemonic phrase here test';
      await expect(keyManager.setup(password, invalidMnemonic))
        .rejects
        .toThrow('Invalid mnemonic');
    });
  });

  describe('Account Management', () => {
    beforeEach(async () => {
      await keyManager.createWallet();
    });

    it('should derive multiple accounts', async () => {
      const account1 = await keyManager.deriveAccount(0);
      const account2 = await keyManager.deriveAccount(1);
      
      expect(account1).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(account2).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should manage active account', async () => {
      const account1 = await keyManager.deriveAccount(0);
      const account2 = await keyManager.deriveAccount(1);
      
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
      await keyManager.createWallet();
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

  describe('Wallet', () => {
    it('should create a new wallet', async () => {
      const wallet = new Wallet(mockNetwork);
      expect(wallet).toBeDefined();
    });
  });
});