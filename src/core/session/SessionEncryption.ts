import { Session } from '../../types/session';
import { WalletError } from '../error/ErrorHandler';

interface EncryptedSession {
  id: string;
  encryptedData: string;
  iv: string;
  keyVersion: number;
  createdAt: number;
}

export class SessionEncryption {
  private static instance: SessionEncryption;
  private encryptionKey: CryptoKey | null = null;
  private keyVersion = 1;

  private constructor() {}

  static getInstance(): SessionEncryption {
    if (!SessionEncryption.instance) {
      SessionEncryption.instance = new SessionEncryption();
    }
    return SessionEncryption.instance;
  }

  async initialize(): Promise<void> {
    if (!this.encryptionKey) {
      this.encryptionKey = await this.generateKey();
    }
  }

  private async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptSession(session: Session): Promise<EncryptedSession> {
    if (!this.encryptionKey) {
      throw new WalletError('Encryption not initialized', 'ENCRYPTION_ERROR');
    }

    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const sessionData = JSON.stringify(session);
      const encoder = new TextEncoder();
      const data = encoder.encode(sessionData);

      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        data
      );

      return {
        id: session.id,
        encryptedData: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv),
        keyVersion: this.keyVersion,
        createdAt: Date.now()
      };
    } catch (error) {
      throw new WalletError(
        'Failed to encrypt session',
        'ENCRYPTION_ERROR',
        { error }
      );
    }
  }

  async decryptSession(encryptedSession: EncryptedSession): Promise<Session> {
    if (!this.encryptionKey) {
      throw new WalletError('Encryption not initialized', 'ENCRYPTION_ERROR');
    }

    try {
      const iv = this.base64ToArrayBuffer(encryptedSession.iv);
      const encryptedData = this.base64ToArrayBuffer(encryptedSession.encryptedData);

      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      const sessionData = decoder.decode(decryptedData);
      return JSON.parse(sessionData);
    } catch (error) {
      throw new WalletError(
        'Failed to decrypt session',
        'DECRYPTION_ERROR',
        { error }
      );
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async rotateKey(): Promise<void> {
    this.keyVersion++;
    this.encryptionKey = await this.generateKey();
  }
} 