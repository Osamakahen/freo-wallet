import { encrypt, decrypt, generateKey, exportKey } from '../../utils/crypto';

interface PasswordConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
}

export class PasswordManager {
  private static readonly PASSWORD_KEY = 'freo_password_hash';
  private static readonly ATTEMPTS_KEY = 'freo_password_attempts';
  private static readonly LOCKOUT_KEY = 'freo_password_lockout';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  private encryptionKey: string | null = null;
  private passwordConfig: PasswordConfig = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true
  };

  constructor() {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize or load the encryption key
   */
  private async initializeEncryptionKey(): Promise<void> {
    const cryptoKey = await generateKey();
    this.encryptionKey = await exportKey(cryptoKey);
  }

  /**
   * Sets up a new password
   */
  async setupPassword(password: string): Promise<void> {
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet strength requirements');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const encryptedPassword = await encrypt(password, this.encryptionKey);
      localStorage.setItem(PasswordManager.PASSWORD_KEY, encryptedPassword);
      localStorage.removeItem(PasswordManager.ATTEMPTS_KEY);
      localStorage.removeItem(PasswordManager.LOCKOUT_KEY);
    } catch (error) {
      throw new Error(`Failed to set up password: ${error}`);
    }
  }

  /**
   * Verifies the provided password
   */
  async verifyPassword(password: string): Promise<boolean> {
    this.checkLockout();
    
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const storedPassword = localStorage.getItem(PasswordManager.PASSWORD_KEY);
      if (!storedPassword) {
        throw new Error('No password has been set up');
      }

      const decryptedPassword = await decrypt(storedPassword, this.encryptionKey);
      const isValid = password === decryptedPassword;

      if (!isValid) {
        this.incrementAttempts();
      } else {
        localStorage.removeItem(PasswordManager.ATTEMPTS_KEY);
      }

      return isValid;
    } catch (error) {
      throw new Error(`Failed to verify password: ${error}`);
    }
  }

  /**
   * Changes the password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const isValid = await this.verifyPassword(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    await this.setupPassword(newPassword);
  }

  /**
   * Validates password strength
   */
  private validatePasswordStrength(password: string): boolean {
    if (password.length < this.passwordConfig.minLength) {
      return false;
    }

    if (this.passwordConfig.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    if (this.passwordConfig.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    if (this.passwordConfig.requireNumbers && !/[0-9]/.test(password)) {
      return false;
    }

    if (this.passwordConfig.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Increments the failed attempts counter
   */
  private incrementAttempts(): void {
    const attempts = Number(localStorage.getItem(PasswordManager.ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(PasswordManager.ATTEMPTS_KEY, attempts.toString());

    if (attempts >= PasswordManager.MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + PasswordManager.LOCKOUT_DURATION;
      localStorage.setItem(PasswordManager.LOCKOUT_KEY, lockoutTime.toString());
    }
  }

  /**
   * Checks if the account is locked out
   */
  private checkLockout(): void {
    const lockoutTime = Number(localStorage.getItem(PasswordManager.LOCKOUT_KEY) || 0);
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      throw new Error(`Account is locked. Try again in ${remainingTime} seconds`);
    }

    if (lockoutTime && Date.now() >= lockoutTime) {
      localStorage.removeItem(PasswordManager.LOCKOUT_KEY);
      localStorage.removeItem(PasswordManager.ATTEMPTS_KEY);
    }
  }

  /**
   * Updates password configuration
   */
  updateConfig(config: Partial<PasswordConfig>): void {
    this.passwordConfig = { ...this.passwordConfig, ...config };
  }

  /**
   * Gets current password configuration
   */
  getConfig(): PasswordConfig {
    return { ...this.passwordConfig };
  }

  /**
   * Clears the password and encryption key
   */
  clearPassword(): void {
    localStorage.removeItem(PasswordManager.PASSWORD_KEY);
    localStorage.removeItem(PasswordManager.ATTEMPTS_KEY);
    localStorage.removeItem(PasswordManager.LOCKOUT_KEY);
  }

  /**
   * Checks if password protection is enabled
   */
  isPasswordEnabled(): boolean {
    return localStorage.getItem(PasswordManager.PASSWORD_KEY) !== null;
  }
} 