import { ethers } from 'ethers';
import { encrypt, decrypt } from '../../utils/crypto';

export class KeyManager {
  private wallet: ethers.Wallet | null = null;
  private encryptedMnemonic: string | null = null;

  async initialize(mnemonic: string, password: string): Promise<void> {
    // Encrypt and store the mnemonic
    this.encryptedMnemonic = await encrypt(mnemonic, password);
    
    // Create wallet from mnemonic
    this.wallet = ethers.Wallet.fromPhrase(mnemonic);
  }

  async getAddress(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.address;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.signMessage(message);
  }

  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.signTransaction(tx);
  }

  async exportMnemonic(password: string): Promise<string> {
    if (!this.encryptedMnemonic) {
      throw new Error('No mnemonic stored');
    }
    return decrypt(this.encryptedMnemonic, password);
  }

  async exportPrivateKey(password: string): Promise<string> {
    if (!this.wallet || !this.encryptedMnemonic) {
      throw new Error('Wallet not initialized');
    }

    // Verify password by attempting to decrypt the mnemonic
    try {
      await decrypt(this.encryptedMnemonic, password);
    } catch (error) {
      throw new Error('Invalid password');
    }

    return this.wallet.privateKey;
  }

  getPublicKey(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.signingKey.publicKey;
  }

  isInitialized(): boolean {
    return this.wallet !== null;
  }

  clear(): void {
    this.wallet = null;
    this.encryptedMnemonic = null;
  }
} 