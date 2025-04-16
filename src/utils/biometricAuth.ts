interface BiometricAuthConfig {
  timeout?: number;
  promptMessage?: string;
}

export class BiometricAuth {
  private config: BiometricAuthConfig;
  private isAvailable: boolean = false;
  private isAuthenticated: boolean = false;
  private lastAuthTime: number = 0;

  constructor(config: BiometricAuthConfig = {}) {
    this.config = {
      timeout: 300000, // 5 minutes default
      promptMessage: 'Please authenticate to access your wallet',
      ...config,
    };
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Check if WebAuthn is available
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        this.isAvailable = available;
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      this.isAvailable = false;
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  async authenticate(): Promise<boolean> {
    if (!this.isAvailable) {
      throw new Error('Biometric authentication is not available on this device');
    }

    // Check if we need to re-authenticate
    const now = Date.now();
    if (this.isAuthenticated && now - this.lastAuthTime < (this.config.timeout || 0)) {
      return true;
    }

    try {
      // Create a new credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'Freo Wallet',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'user',
            displayName: 'User',
          },
          pubKeyCredParams: [
            {
              type: 'public-key',
              alg: -7, // ES256
            },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });

      if (credential) {
        this.isAuthenticated = true;
        this.lastAuthTime = now;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  async verify(): Promise<boolean> {
    if (!this.isAvailable) {
      throw new Error('Biometric authentication is not available on this device');
    }

    try {
      // Get an existing credential
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (credential) {
        this.isAuthenticated = true;
        this.lastAuthTime = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  invalidate(): void {
    this.isAuthenticated = false;
    this.lastAuthTime = 0;
  }
} 