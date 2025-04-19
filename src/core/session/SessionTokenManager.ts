import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import AnalyticsService from '../../services/AnalyticsService';

export class SessionTokenManager {
  private static instance: SessionTokenManager;
  private tokens: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): SessionTokenManager {
    if (!SessionTokenManager.instance) {
      SessionTokenManager.instance = new SessionTokenManager();
    }
    return SessionTokenManager.instance;
  }

  async createSessionToken(sessionId: string): Promise<string> {
    const token = crypto.randomUUID();
    this.tokens.set(sessionId, token);
    return token;
  }

  async validateSessionToken(sessionId: string, token: string): Promise<boolean> {
    const storedToken = this.tokens.get(sessionId);
    return storedToken === token;
  }

  async revokeSessionToken(sessionId: string): Promise<void> {
    this.tokens.delete(sessionId);
  }

  async getSessionToken(sessionId: string): Promise<string | undefined> {
    return this.tokens.get(sessionId);
  }
} 