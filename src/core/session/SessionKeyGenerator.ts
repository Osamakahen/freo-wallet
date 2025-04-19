import { randomBytes } from 'crypto';
import { hkdf } from '@panva/hkdf';
import { getDeviceFingerprint } from '../../utils/device';
import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';

export interface SessionKey {
  key: CryptoKey;
  salt: Uint8Array;
  fingerprint: string;
}

export class SessionKeyGenerator {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 32;
  private static readonly SALT_LENGTH = 32;
  private static readonly INFO = 'freo-wallet-session-key';
  private static instance: SessionKeyGenerator;
  private errorCorrelator: ErrorCorrelator;

  private constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): SessionKeyGenerator {
    if (!SessionKeyGenerator.instance) {
      SessionKeyGenerator.instance = new SessionKeyGenerator();
    }
    return SessionKeyGenerator.instance;
  }

  /**
   * Generates a new session key using HKDF
   * @param masterKey - The master key to derive from
   * @returns A promise that resolves to a SessionKey object
   */
  static async generateSessionKey(masterKey: CryptoKey): Promise<SessionKey> {
    try {
      // Generate a random salt
      const salt = randomBytes(this.SALT_LENGTH);
      
      // Get device fingerprint
      const fingerprint = await getDeviceFingerprint();
      
      // Export the key material from the CryptoKey
      const keyMaterial = await crypto.subtle.exportKey('raw', masterKey);
      const keyBytes = new Uint8Array(keyMaterial);
      
      // Derive session key using HKDF
      const derivedKey = await hkdf(
        'sha256',
        keyBytes,
        salt,
        this.INFO,
        this.KEY_LENGTH
      );
      
      // Import the derived key material as a CryptoKey
      const key = await crypto.subtle.importKey(
        'raw',
        derivedKey,
        { name: this.ALGORITHM, length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      return {
        key,
        salt,
        fingerprint
      };
    } catch (error) {
      throw new WalletError(
        'Failed to generate session key',
        'SESSION_KEY_GENERATION_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  /**
   * Validates a session key against a device fingerprint
   * @param key - The session key to validate
   * @param fingerprint - The device fingerprint to validate against
   * @returns A promise that resolves to true if the key is valid
   */
  static async validateSessionKey(key: SessionKey, fingerprint: string): Promise<boolean> {
    return key.fingerprint === fingerprint;
  }

  async generateKey(): Promise<Uint8Array> {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      const exportedKey = await crypto.subtle.exportKey('raw', key);
      return new Uint8Array(exportedKey);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError(
          'Failed to generate session key',
          'SESSION_KEY_GENERATION_ERROR',
          { error: error instanceof Error ? error : new Error(String(error)) }
        )
      );
      throw error;
    }
  }

  async encryptData(data: string, key: Uint8Array): Promise<string> {
    try {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        encodedData
      );

      const encryptedArray = new Uint8Array(encryptedData);
      const result = new Uint8Array(iv.length + encryptedArray.length);
      result.set(iv);
      result.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError(
          'Failed to encrypt data',
          'DATA_ENCRYPTION_ERROR',
          { error: error instanceof Error ? error : new Error(String(error)) }
        )
      );
      throw error;
    }
  }

  async decryptData(encryptedData: string, key: Uint8Array): Promise<string> {
    try {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        encrypted
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError(
          'Failed to decrypt data',
          'DATA_DECRYPTION_ERROR',
          { error: error instanceof Error ? error : new Error(String(error)) }
        )
      );
      throw error;
    }
  }
} 