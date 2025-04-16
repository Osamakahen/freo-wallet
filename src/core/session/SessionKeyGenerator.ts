import { randomBytes } from 'crypto';
import { hkdf } from '@panva/hkdf';
import { getDeviceFingerprint } from '../../utils/device';

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

  /**
   * Generates a new session key using HKDF
   * @param masterKey - The master key to derive from
   * @returns A promise that resolves to a SessionKey object
   */
  static async generateSessionKey(masterKey: CryptoKey): Promise<SessionKey> {
    // Generate a random salt
    const salt = randomBytes(this.SALT_LENGTH);
    
    // Get device fingerprint
    const fingerprint = await getDeviceFingerprint();
    
    // Derive session key using HKDF
    const keyMaterial = await hkdf(
      'sha256',
      masterKey,
      salt,
      this.INFO,
      this.KEY_LENGTH
    );
    
    // Import the derived key material as a CryptoKey
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: this.ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return {
      key,
      salt,
      fingerprint
    };
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
} 