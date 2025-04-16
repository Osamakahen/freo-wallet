import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { signTransaction } from 'viem/actions';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { generateMnemonic, validateMnemonic } from '../../utils/crypto';
import { WalletInitError, SecurityError, ValidationError } from '../errors/WalletErrors';
import { TransactionRequest } from '../../types/wallet';

interface EncryptedData {
  iv: string;
  data: string;
}

interface Account {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  path: string;
  index: number;
}

export class KeyManager {
  private accounts: Map<number, Account> = new Map();
  private activeAccountIndex: number = 0;
  private encryptedMnemonic: EncryptedData | null = null;
  private isLocked: boolean = true;
  private client: ReturnType<typeof createPublicClient>;

  constructor() {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http()
    });
  }

  async setup(password: string, mnemonic?: string): Promise<void> {
    const walletMnemonic = mnemonic || generateMnemonic();
    if (!validateMnemonic(walletMnemonic)) {
      throw new ValidationError('Invalid mnemonic');
    }

    // Create first account from mnemonic
    const account = mnemonicToAccount(walletMnemonic);
    const hdKey = account.getHdKey();
    const privateKey = hdKey.privateKey?.toString();
    if (!privateKey) {
      throw new SecurityError('Failed to derive private key');
    }
    
    this.accounts.set(0, {
      address: account.address,
      privateKey: `0x${privateKey}`,
      path: "m/44'/60'/0'/0/0",
      index: 0
    });
    
    // Encrypt mnemonic with Web Crypto API
    this.encryptedMnemonic = await this.encryptData(walletMnemonic, password);
  }

  async unlock(password: string): Promise<void> {
    if (!this.encryptedMnemonic) {
      throw new WalletInitError('Wallet not initialized');
    }

    try {
      // Decrypt mnemonic
      const mnemonic = await this.decryptData(this.encryptedMnemonic, password);
      
      // Recreate first account
      const account = mnemonicToAccount(mnemonic);
      const hdKey = account.getHdKey();
      const privateKey = hdKey.privateKey?.toString();
      if (!privateKey) {
        throw new SecurityError('Failed to derive private key');
      }
      
      this.accounts.set(0, {
        address: account.address,
        privateKey: `0x${privateKey}`,
        path: "m/44'/60'/0'/0/0",
        index: 0
      });
      
      this.isLocked = false;
    } catch (error) {
      throw new SecurityError('Invalid password');
    }
  }

  async lock(): Promise<void> {
    this.accounts.clear();
    this.isLocked = true;
  }

  async deriveAccount(index: number): Promise<string> {
    if (this.isLocked) {
      throw new SecurityError('Wallet is locked');
    }

    if (index === 0) {
      return this.accounts.get(0)?.address || '';
    }

    // For now, we only support the first account
    // TODO: Implement proper HD wallet derivation
    throw new ValidationError('Only first account is supported');
  }

  async getActiveAccount(): Promise<Account> {
    const account = this.accounts.get(this.activeAccountIndex);
    if (!account || this.isLocked) {
      throw new SecurityError('Wallet not initialized or locked');
    }
    return account;
  }

  async getAddress(): Promise<`0x${string}`> {
    const account = await this.getActiveAccount();
    return account.address;
  }

  async signTransaction(transaction: TransactionRequest): Promise<`0x${string}`> {
    const account = await this.getActiveAccount();
    const accountObj = privateKeyToAccount(account.privateKey);
    
    return signTransaction(this.client, {
      account: accountObj,
      chain: mainnet,
      to: transaction.to as `0x${string}`,
      value: transaction.value ? BigInt(transaction.value) : undefined,
      data: transaction.data as `0x${string}` | undefined,
      gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
      maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : undefined,
      nonce: transaction.nonce ? Number(transaction.nonce) : undefined,
      chainId: transaction.chainId ? Number(transaction.chainId) : undefined
    });
  }

  async signMessage(message: string): Promise<`0x${string}`> {
    const account = await this.getActiveAccount();
    const accountObj = privateKeyToAccount(account.privateKey);
    return accountObj.signMessage({ message });
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  private async encryptData(data: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt the data
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoder.encode(data)
    );
    
    return {
      iv: Buffer.from(iv).toString('hex'),
      data: Buffer.from(new Uint8Array(encryptedContent)).toString('hex')
    };
  }

  private async decryptData(encryptedData: EncryptedData, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const data = Buffer.from(encryptedData.data, 'hex');
    
    // Recreate the key
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: iv, // Using IV as salt for simplicity, should use separate salt in production
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt the data
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    return new TextDecoder().decode(decryptedContent);
  }
} 