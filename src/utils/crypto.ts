/**
 * Crypto utility functions for secure wallet data encryption/decryption
 * Uses Web Crypto API with AES-GCM
 */

import { ethers } from 'ethers';
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';
import { Buffer } from 'buffer';

// Add type definition for Navigator.deviceMemory
declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

// Constants
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;
const DIGEST = 'sha256';
const ALGORITHM = 'AES-GCM';

// Helper functions
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString('base64');
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  return Buffer.from(base64, 'base64');
};

/**
 * Derives an encryption key from the device fingerprint and optional password
 */
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: DIGEST
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Generates a device fingerprint using various browser characteristics
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.pixelDepth,
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    await getCanvasFingerprint()
  ];

  const fingerprint = components.join('||');
  return ethers.keccak256(ethers.toUtf8Bytes(fingerprint));
}

/**
 * Generates a canvas-based fingerprint
 */
function getCanvasFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('no-canvas-support');
      return;
    }

    // Draw various shapes and text
    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = '#069';
    ctx.fillText('FreoWallet', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint', 4, 17);

    resolve(canvas.toDataURL());
  });
}

/**
 * Encrypts data using AES-GCM
 * @param data - The data to encrypt
 * @param password - The encryption password
 * @returns The encrypted data and IV as a hex string
 */
export const encryptData = async (data: string, password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    encoder.encode(data)
  );

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return arrayBufferToBase64(combined.buffer);
};

/**
 * Decrypts data using AES-GCM
 * @param encryptedData - The encrypted data as a hex string
 * @param password - The decryption password
 * @returns The decrypted data
 */
export const decryptData = async (encryptedData: string, password: string): Promise<string> => {
  const combined = base64ToArrayBuffer(encryptedData);
  const salt = new Uint8Array(combined, 0, SALT_LENGTH);
  const iv = new Uint8Array(combined, SALT_LENGTH, IV_LENGTH);
  const encrypted = new Uint8Array(combined, SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

/**
 * Generates a random key using Web Crypto API
 */
export async function generateKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to raw bytes
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Imports raw bytes as a CryptoKey
 */
export const importKey = async (keyData: string): Promise<CryptoKey> => {
  const keyBytes = new Uint8Array(
    keyData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  return window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Generates a BIP39 mnemonic
 */
export function generateMnemonic(): string {
  return ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
}

/**
 * Validates a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return ethers.Mnemonic.isValidMnemonic(mnemonic);
}

export function generateRandomBytes(size: number): Buffer {
  return randomBytes(size);
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export async function encrypt(data: string, key: string): Promise<string> {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex')
  });
}

export async function decrypt(encryptedData: string, key: string): Promise<string> {
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);
  
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
} 