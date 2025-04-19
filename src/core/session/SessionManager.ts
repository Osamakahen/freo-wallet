import { Address } from 'viem';
import { encrypt, decrypt } from '../../utils/crypto';
import { SessionKey, SessionToken, SessionState, DeviceInfo, SessionConfig, Session } from '../../types/session';
import { generateRandomBytes } from '../../utils/crypto';
import { SessionPermissions } from '../../types/dapp';
import { SessionKeyManager } from './SessionKeyManager';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { WalletError } from '../error/ErrorHandler';
import { SessionAnalytics } from './SessionAnalytics';
import { SecurityService } from '../../services/SecurityService';
import { KeyManager } from '../key/KeyManager';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { SessionTokenManager } from './SessionTokenManager';
import { EnhancedSessionManager } from './EnhancedSessionManager';
import { AnalyticsService } from '../../services/AnalyticsService';
import { DeviceFingerprint } from '../security/DeviceFingerprint';

interface SessionState {
  isActive: boolean;
  lastActivity: number;
  permissions: Set<string>;
  address?: Address;
  chainId?: number;
  error?: Error;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private recoveryTokens: Map<string, string> = new Map();
  private keyManager: SessionKeyManager;
  private tokenManager: SessionTokenManager;
  private enhancedManager: EnhancedSessionManager;
  private config: SessionConfig;
  private storage: Storage;
  private deviceInfo: DeviceInfo;
  private state: SessionState;
  private readonly STORAGE_KEY = 'freo_sessions';
  private analytics: SessionAnalytics;
  private securityService: SecurityService;
  private errorCorrelator: ErrorCorrelator;

  constructor() {
    this.keyManager = SessionKeyManager.getInstance();
    this.tokenManager = new SessionTokenManager();
    this.enhancedManager = new EnhancedSessionManager({
      tokenDuration: 3600000, // 1 hour
      maxSessions: 5,
      deviceVerification: true
    }, this);
    this.config = {
      tokenDuration: 3600000, // 1 hour
      maxSessions: 5,
      deviceVerification: true
    };
    this.storage = window.localStorage;
    this.deviceInfo = this.getDeviceInfo();
    this.state = {
      isActive: false,
      lastActivity: Date.now(),
      permissions: new Set()
    };
    this.analytics = new SessionAnalytics();
    this.securityService = SecurityService.getInstance();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.loadSessions();
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      browser: navigator.userAgent,
      os: navigator.platform,
      platform: navigator.platform,
      deviceType: this.getDeviceType(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  async createSession(options: { chainId: number; address: Address }): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      chainId: options.chainId,
      address: options.address,
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
      deviceChanges: [],
      permissionChanges: [],
      isActive: true,
      lastActivity: Date.now(),
      permissions: {
        read: true,
        write: false,
        sign: false,
        connect: true,
        disconnect: true
      }
    };

    await this.keyManager.generateSessionKey(session.id);
    await this.tokenManager.createSessionToken(session.id);
    await this.enhancedManager.initializeSession(session);

    this.sessions.set(session.id, session);
    this.saveSessions();
    return session;
  }

  async endSession(sessionId: string): Promise<void> {
    await this.keyManager.revokeSessionKey(sessionId);
    await this.tokenManager.revokeSessionToken(sessionId);
    await this.enhancedManager.endSession(sessionId);
    this.sessions.delete(sessionId);
    this.saveSessions();
  }

  public async refreshSession(sessionId: string, deviceInfo: DeviceInfo): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (this.config.deviceVerification) {
      const deviceMatches = this.verifyDeviceInfo(session.deviceInfo, deviceInfo);
      if (!deviceMatches) {
        throw new Error('Device verification failed');
      }
    }

    const updatedSession: Session = {
      ...session,
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, updatedSession);
    this.saveSessions();
    return updatedSession;
  }

  private verifyDeviceInfo(stored: DeviceInfo, current: DeviceInfo): boolean {
    return (
      stored.browser === current.browser &&
      stored.platform === current.platform &&
      stored.language === current.language
    );
  }

  public getActiveSession(): Session | null {
    const now = Date.now();
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        return session;
      }
    }
    return null;
  }

  public revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.saveSessions();
  }

  public generateRecoveryToken(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const token = crypto.randomUUID();
    this.recoveryTokens.set(token, sessionId);
    
    if (this.config.recoveryTokenDuration) {
      setTimeout(() => {
        this.recoveryTokens.delete(token);
      }, this.config.recoveryTokenDuration * 1000);
    }
    
    return token;
  }

  public recoverSession(token: string): Session | null {
    const sessionId = this.recoveryTokens.get(token);
    if (!sessionId) return null;

    const session = this.sessions.get(sessionId);
    if (!session) return null;

    this.recoveryTokens.delete(token);
    return session;
  }

  public async requestSessionApproval(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // TODO: Implement permission request UI and user approval
    return true;
  }

  public disconnect(): void {
    this.state = {
      isActive: false,
      lastActivity: Date.now(),
      permissions: new Set()
    };
  }

  public getState(): SessionState {
    return { ...this.state };
  }

  public getConfig(): SessionConfig {
    return { ...this.config };
  }

  public async generateSessionKey(password: string): Promise<SessionKey> {
    try {
      const key = crypto.getRandomValues(new Uint8Array(32));
      const now = Date.now();

      const sessionKey: SessionKey = {
        key: Array.from(key).map(b => b.toString(16).padStart(2, '0')).join(''),
        expiresAt: now + this.config.tokenDuration
      };

      return sessionKey;
    } catch (error) {
      throw new WalletError(
        'Failed to generate session key',
        'SESSION_KEY_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  public async connect(address: Address, chainId: number): Promise<void> {
    this.state = {
      ...this.state,
      isActive: true,
      address,
      chainId,
      error: undefined
    };
  }

  public async revokeAllSessions(): Promise<void> {
    try {
      this.sessions.clear();
      this.saveSessions();
    } catch (error) {
      throw new WalletError(
        'Failed to revoke all sessions',
        'SESSION_REVOCATION_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  public async getSessions(): Promise<Session[]> {
    try {
      return Array.from(this.sessions.values());
    } catch (error) {
      throw new WalletError(
        'Failed to get sessions',
        'SESSION_RETRIEVAL_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  public async migrateSession(oldSessionId: string, newChainId: number): Promise<Session> {
    const session = this.sessions.get(oldSessionId);
    if (!session) {
      throw new WalletError('Session not found', 'SESSION_NOT_FOUND');
    }

    const newSession: Session = {
      ...session,
      chainId: newChainId,
      timestamp: Date.now(),
      lastActivity: Date.now()
    };

    this.sessions.set(newSession.id, newSession);
    this.saveSessions();
    return newSession;
  }

  async getSessionAnalytics(sessionId: string) {
    return this.analytics.getSessionMetrics(sessionId);
  }

  private saveSessions(): void {
    const sessions = Array.from(this.sessions.entries());
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  private loadSessions(): void {
    const stored = this.storage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const sessions = JSON.parse(stored);
        this.sessions = new Map(sessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        this.sessions = new Map();
      }
    }
  }
}