import { KeyManager } from '../../../core/keyManagement/KeyManager';
import { Mnemonic } from 'ethers';

describe('KeyManager', () => {
  let keyManager: KeyManager;

  beforeEach(() => {
    localStorage.clear();
    keyManager = new KeyManager();
  });

  describe('Wallet Generation', () => {
    it('should generate a valid mnemonic', async () => {
      const mnemonic = await keyManager.generateWallet();
      expect(Mnemonic.isValidMnemonic(mnemonic)).toBe(true);
    });

    it('should create first account after wallet generation', async () => {
      await keyManager.generateWallet();
      const accounts = keyManager.getAccounts();
      expect(accounts.length).toBe(1);
      expect(accounts[0].index).toBe(0);
      expect(accounts[0].path).toBe("m/44'/60'/0'/0/0");
    });

    it('should store encrypted wallet data', async () => {
      await keyManager.generateWallet();
      const storedData = localStorage.getItem('freo_wallet_keystore');
      expect(storedData).toBeTruthy();
    });
  });

  describe('Wallet Import', () => {
    const testMnemonic = 'test test test test test test test test test test test junk';

    it('should import wallet from valid mnemonic', async () => {
      await keyManager.importWallet(testMnemonic);
      const accounts = keyManager.getAccounts();
      expect(accounts.length).toBe(1);
    });

    it('should reject invalid mnemonic', async () => {
      const invalidMnemonic = 'invalid mnemonic phrase';
      await expect(keyManager.importWallet(invalidMnemonic))
        .rejects
        .toThrow('Invalid mnemonic phrase');
    });
  });

  describe('Account Management', () => {
    beforeEach(async () => {
      await keyManager.generateWallet();
    });

    it('should derive next account', async () => {
      const newAccount = await keyManager.deriveNextAccount();
      expect(newAccount.index).toBe(1);
      expect(newAccount.path).toBe("m/44'/60'/0'/0/1");
    });

    it('should get active account', () => {
      const activeAccount = keyManager.getActiveAccount();
      expect(activeAccount.index).toBe(0);
    });

    it('should set active account', async () => {
      const newAccount = await keyManager.deriveNextAccount();
      keyManager.setActiveAccount(newAccount.address);
      const activeAccount = keyManager.getActiveAccount();
      expect(activeAccount.address).toBe(newAccount.address);
    });

    it('should throw error for invalid active account', () => {
      expect(() => keyManager.setActiveAccount('0xinvalid'))
        .toThrow('Account not found');
    });
  });

  describe('Signing Operations', () => {
    beforeEach(async () => {
      await keyManager.generateWallet();
    });

    it('should sign message', async () => {
      const message = 'Hello, World!';
      const signature = await keyManager.signMessage(message);
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('should sign transaction', async () => {
      const transaction = {
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000', // 1 ETH
        gasLimit: '21000',
        maxFeePerGas: '20000000000',
        maxPriorityFeePerGas: '1000000000'
      };
      const signedTx = await keyManager.signTransaction(transaction);
      expect(signedTx).toMatch(/^0x[a-fA-F0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when signing without initialized wallet', async () => {
      await expect(keyManager.signMessage('test'))
        .rejects
        .toThrow('Wallet not initialized');
    });

    it('should throw error when getting account without wallet', () => {
      expect(() => keyManager.getActiveAccount())
        .toThrow('No active account');
    });
  });
}); 