import { ethers } from 'ethers';
import { Buffer } from 'buffer';

interface SecureStorageConfig {
  encryptionKey: string;
  storageKey: string;
}

export class SecureStorage {
  private config: SecureStorageConfig;
  private encryptionKey: Buffer;

  constructor(config: SecureStorageConfig) {
    this.config = config;
    this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
  }

  private async encrypt(data: string): Promise<string> {
    const iv = Buffer.from(ethers.randomBytes(16));
    const cipher = ethers.utils.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  private async decrypt(encryptedData: string): Promise<string> {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    const decipher = ethers.utils.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const encrypted = await this.encrypt(JSON.stringify(value));
      localStorage.setItem(`${this.config.storageKey}:${key}`, encrypted);
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const encrypted = localStorage.getItem(`${this.config.storageKey}:${key}`);
      if (!encrypted) return null;
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(`${this.config.storageKey}:${key}`);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`${this.config.storageKey}:`)
    );
    keys.forEach((key) => localStorage.removeItem(key));
  }
} 