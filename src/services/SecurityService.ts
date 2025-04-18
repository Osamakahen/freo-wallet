import { generateKey, exportKey, importKey } from '../utils/crypto'
import { WalletError } from '../core/error/ErrorHandler';
import { ErrorCorrelator } from '../core/error/ErrorCorrelator';

interface SecurityConfig {
  maxFailedAttempts: number
  lockoutDuration: number // in milliseconds
  sessionTimeout: number // in milliseconds
  requireBiometric: boolean
}

export class SecurityService {
  private static readonly STORAGE_PREFIX = 'freo_wallet_'
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    requireBiometric: true,
  }

  private config: SecurityConfig
  private encryptionKey: CryptoKey | null = null
  private lastActivity: number = Date.now()
  private static instance: SecurityService;
  private errorCorrelator: ErrorCorrelator;

  private constructor() {
    this.config = SecurityService.DEFAULT_CONFIG
    this.initializeEncryptionKey()
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private async initializeEncryptionKey(): Promise<void> {
    try {
      const storedKey = localStorage.getItem(`${SecurityService.STORAGE_PREFIX}encryption_key`)
      if (storedKey) {
        this.encryptionKey = await importKey(storedKey)
      } else {
        this.encryptionKey = await generateKey()
        const exportedKey = await exportKey(this.encryptionKey)
        localStorage.setItem(`${SecurityService.STORAGE_PREFIX}encryption_key`, exportedKey)
      }
    } catch (error) {
      console.error('Error initializing encryption key:', error)
      throw new Error('Failed to initialize encryption key')
    }
  }

  async verifyBiometric(): Promise<boolean> {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4]),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
        },
      })
      return !!credential
    } catch (error) {
      console.error('Biometric verification failed:', error)
      return false
    }
  }

  private getFailedAttempts(): number {
    return Number(localStorage.getItem(`${SecurityService.STORAGE_PREFIX}failed_attempts`) || '0')
  }

  private incrementFailedAttempts(): void {
    const attempts = this.getFailedAttempts() + 1
    localStorage.setItem(`${SecurityService.STORAGE_PREFIX}failed_attempts`, attempts.toString())
    
    if (attempts >= this.config.maxFailedAttempts) {
      this.lockWallet()
    }
  }

  private resetFailedAttempts(): void {
    localStorage.removeItem(`${SecurityService.STORAGE_PREFIX}failed_attempts`)
    localStorage.removeItem(`${SecurityService.STORAGE_PREFIX}lockout_time`)
  }

  private lockWallet(): void {
    const lockoutTime = Date.now() + this.config.lockoutDuration
    localStorage.setItem(`${SecurityService.STORAGE_PREFIX}lockout_time`, lockoutTime.toString())
  }

  isWalletLocked(): boolean {
    const lockoutTime = Number(localStorage.getItem(`${SecurityService.STORAGE_PREFIX}lockout_time`) || '0')
    return Date.now() < lockoutTime
  }

  getRemainingLockoutTime(): number {
    const lockoutTime = Number(localStorage.getItem(`${SecurityService.STORAGE_PREFIX}lockout_time`) || '0')
    return Math.max(0, lockoutTime - Date.now())
  }

  updateActivity(): void {
    this.lastActivity = Date.now()
  }

  isSessionExpired(): boolean {
    return Date.now() - this.lastActivity > this.config.sessionTimeout
  }

  public async validateTransaction(): Promise<boolean> {
    // TODO: Implement actual transaction validation
    return true;
  }

  clearSecurityData(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(SecurityService.STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    this.encryptionKey = null
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      // Check if session exists in storage
      const storedSession = localStorage.getItem(`${SecurityService.STORAGE_PREFIX}session_${sessionId}`);
      if (!storedSession) {
        return false;
      }
      
      // Validate session expiration
      const session = JSON.parse(storedSession);
      const isExpired = Date.now() - session.timestamp > this.config.sessionTimeout;
      
      if (isExpired) {
        localStorage.removeItem(`${SecurityService.STORAGE_PREFIX}session_${sessionId}`);
        return false;
      }
      
      return true;
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to validate session')
      );
      return false;
    }
  }

  async encryptData(data: string): Promise<string> {
    try {
      // Implement encryption logic here
      return data;
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to encrypt data')
      );
      throw error;
    }
  }

  async decryptData(encryptedData: string): Promise<string> {
    try {
      // Implement decryption logic here
      return encryptedData;
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to decrypt data')
      );
      throw error;
    }
  }

  private async validatePassword(password: string): Promise<boolean> {
    try {
      // Get stored password hash from localStorage
      const storedHash = localStorage.getItem(`${SecurityService.STORAGE_PREFIX}password_hash`);
      if (!storedHash) {
        return false;
      }

      // Hash the provided password
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Compare hashes
      return hashHex === storedHash;
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to validate password')
      );
      return false;
    }
  }
} 