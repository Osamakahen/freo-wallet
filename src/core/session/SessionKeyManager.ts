import { SessionKey, SessionToken } from '../../types/session';
import { SecurityService } from '../../services/SecurityService';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { WalletError } from '../error/ErrorHandler';

export class SessionKeyManager {
  private static instance: SessionKeyManager;
  private securityService: SecurityService;
  private errorCorrelator: ErrorCorrelator;

  private constructor() {
    this.securityService = SecurityService.getInstance();
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): SessionKeyManager {
    if (!SessionKeyManager.instance) {
      SessionKeyManager.instance = new SessionKeyManager();
    }
    return SessionKeyManager.instance;
  }

  async generateSessionKey(password: string): Promise<SessionKey> {
    try {
      const key = await this.securityService.encryptData(password);
      return {
        id: Math.random().toString(36).substring(2, 15),
        key
      };
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to generate session key')
      );
      throw error;
    }
  }

  async generateSessionToken(
    key: string,
    address: string,
    deviceInfo: string,
    duration: number
  ): Promise<SessionToken> {
    try {
      const token = await this.securityService.encryptData(
        JSON.stringify({ key, address, deviceInfo })
      );
      return {
        id: Math.random().toString(36).substring(2, 15),
        token,
        expiresAt: Date.now() + duration * 1000
      };
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to generate session token')
      );
      throw error;
    }
  }
} 