import { generateKey, exportKey, importKey } from './crypto';

export type StorableValue = string | number | boolean | object | null;

export class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {
    this.initializeEncryptionKey();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private async initializeEncryptionKey(): Promise<void> {
    try {
      const storedKey = localStorage.getItem('secure_storage_key');
      if (storedKey) {
        this.encryptionKey = await importKey(storedKey);
      } else {
        this.encryptionKey = await generateKey();
        const exportedKey = await exportKey(this.encryptionKey);
        localStorage.setItem('secure_storage_key', exportedKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw error;
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    // Implementation of encryption
    return data;
  }

  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }
    // Implementation of decryption
    return encryptedData;
  }

  async setItem(key: string, value: StorableValue): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = await this.encrypt(serializedValue);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T extends StorableValue>(key: string): Promise<T | null> {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;

      const decryptedValue = await this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }
} 