/// <reference lib="dom" />
import { WalletError } from '../error/ErrorHandler';

export type BiometricType = 'fingerprint' | 'face' | 'iris';

interface BiometricCredentials {
  type: BiometricType;
  publicKey: string;
  signature: string;
  createdAt: number;
}

interface BiometricSettings {
  enabled: boolean;
  type: BiometricType;
  fallbackEnabled: boolean;
  lastUsed: number;
}

export class BiometricAuth {
  private static instance: BiometricAuth;
  private credentials: Map<string, BiometricCredentials> = new Map();
  private settings: Map<string, BiometricSettings> = new Map();

  private constructor() {}

  static getInstance(): BiometricAuth {
    if (!BiometricAuth.instance) {
      BiometricAuth.instance = new BiometricAuth();
    }
    return BiometricAuth.instance;
  }

  async isBiometricAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      return false;
    }
  }

  async registerBiometric(userId: string, type: BiometricType): Promise<void> {
    if (!await this.isBiometricAvailable()) {
      throw new WalletError('Biometric authentication not available', 'BIOMETRIC_UNAVAILABLE');
    }

    try {
      const publicKeyCredential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'Freo Wallet',
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(16),
            name: userId,
            displayName: userId
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      if (publicKeyCredential instanceof PublicKeyCredential) {
        const credentials: BiometricCredentials = {
          type,
          publicKey: this.arrayBufferToBase64(publicKeyCredential.response.clientDataJSON),
          signature: this.arrayBufferToBase64((publicKeyCredential.response as AuthenticatorAttestationResponse).attestationObject),
          createdAt: Date.now()
        };

        this.credentials.set(userId, credentials);
        this.settings.set(userId, {
          enabled: true,
          type,
          fallbackEnabled: true,
          lastUsed: Date.now()
        });
      }
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to register biometric credentials',
        'BIOMETRIC_REGISTRATION_ERROR',
        { error: new Error(error instanceof Error ? error.message : String(error)) }
      );
    }
  }

  async verifyBiometric(userId: string): Promise<boolean> {
    const credentials = this.credentials.get(userId);
    if (!credentials) {
      throw new WalletError('No biometric credentials found', 'NO_BIOMETRIC_CREDENTIALS');
    }

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: this.base64ToArrayBuffer(credentials.publicKey)
          }],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (assertion instanceof PublicKeyCredential) {
        const settings = this.settings.get(userId);
        if (settings) {
          settings.lastUsed = Date.now();
          this.settings.set(userId, settings);
        }
        return true;
      }

      return false;
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to verify biometric',
        'BIOMETRIC_VERIFICATION_ERROR',
        { error: new Error(error instanceof Error ? error.message : String(error)) }
      );
    }
  }

  async getBiometricSettings(userId: string): Promise<BiometricSettings | undefined> {
    return this.settings.get(userId);
  }

  async updateBiometricSettings(userId: string, settings: Partial<BiometricSettings>): Promise<void> {
    const currentSettings = this.settings.get(userId);
    if (!currentSettings) {
      throw new WalletError('Biometric not enabled', 'BIOMETRIC_NOT_ENABLED');
    }

    this.settings.set(userId, {
      ...currentSettings,
      ...settings
    });
  }

  async disableBiometric(userId: string): Promise<void> {
    this.credentials.delete(userId);
    this.settings.delete(userId);
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
} 