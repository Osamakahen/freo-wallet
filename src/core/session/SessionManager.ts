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
import { KeyManager } from '../keyManagement/KeyManager';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { SessionTokenManager } from './SessionTokenManager';
import { EnhancedSessionManager } from './EnhancedSessionManager';
import AnalyticsService from '../../services/AnalyticsService';
import { DeviceFingerprint } from '../security/DeviceFingerprint';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private keyManager: SessionKeyManager;
  private tokenManager: SessionTokenManager;
  private enhancedManager: EnhancedSessionManager;
  private config: SessionConfig;
  private recoveryTokens: Map<string, string> = new Map();
  private storage: Storage;
  private state: SessionState;
  private deviceInfo: DeviceInfo;
  private activeSessionId: string | null = null;
  private readonly STORAGE_KEY = 'freo_sessions';
  private analytics: SessionAnalytics;
  private errorCorrelator: ErrorCorrelator;
  private securityService: SecurityService;

  constructor() {
    this.keyManager = SessionKeyManager.getInstance();
    this.tokenManager = SessionTokenManager.getInstance();
    this.enhancedManager = new EnhancedSessionManager({
      tokenDuration: 300000,
      refreshThreshold: 60000,
      maxSessions: 5,
      deviceVerification: true,
      analyticsEnabled: true,
      monitoringEnabled: true,
      recoveryTokenDuration: 3600
    }, this);
    this.config = {
      tokenDuration: 300000,
      refreshThreshold: 60000,
      maxSessions: 5,
      deviceVerification: true,
      analyticsEnabled: true,
      monitoringEnabled: true,
      recoveryTokenDuration: 3600
    };
    this.storage = window.localStorage;
    this.state = {
      isConnected: false,
      address: null,
      chainId: null,
      error: null
    };
    this.deviceInfo = this.getDeviceInfo();
    this.analytics = new SessionAnalytics();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.securityService = SecurityService.getInstance();
    this.loadSessions();
  }

  private loadSessions(): void {
    const stored = this.storage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const rawSessions = JSON.parse(stored);
        this.sessions = new Map(
          Object.entries(rawSessions.sessions).map(([id, session]: [string, any]) => [
            id,
            {
              ...session,
              createdAt: new Date(session.createdAt),
              expiresAt: new Date(session.expiresAt),
              address: session.address as Address,
              chainId: session.chainId,
              permissions: session.permissions || {
                read: true,
                write: false,
                sign: false,
                connect: true,
                disconnect: true
              }
            }
          ])
        );
      } catch (error) {
        console.error('Failed to parse sessions from storage', error);
        this.sessions = new Map();
      }
    }
  }

  private saveSessions(): void {
      const data = {
      sessions: Object.fromEntries(this.sessions)
      };
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(data));
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

  private generateDeviceFingerprint(): string {
    const deviceString = JSON.stringify(this.deviceInfo);
    return createHash('sha256').update(deviceString).digest('hex');
  }

  async createSession(options: { chainId: number; address: Address }): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
      deviceChanges: [],
      permissionChanges: [],
      isActive: true,
      lastActivity: Date.now(),
      chainId: options.chainId,
      address: options.address,
      permissions: {
        read: true,
        write: false,
        sign: false,
        nft: false
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
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
    await this.tokenManager.revokeSessionToken(sessionId);
    await this.enhancedManager.endSession(sessionId);
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
      lastActivity: Date.now(),
      deviceInfo: deviceInfo
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
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        return session;
      }
    }
    return null;
  }

  public revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
      this.saveSessions();
    }
  }

  public generateRecoveryToken(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const token = crypto.randomUUID();
    this.recoveryTokens.set(token, sessionId);
    
    setTimeout(() => {
      this.recoveryTokens.delete(token);
    }, this.config.recoveryTokenDuration! * 1000);
    
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
      isConnected: false,
      address: null,
      chainId: null,
      error: null
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
      const key = generateRandomBytes(32);
      const now = Date.now();

      const sessionKey: SessionKey = {
        id: uuidv4(),
        key: key.toString('hex')
      };

      const encryptedKey = await encrypt(JSON.stringify(sessionKey), password);
      this.storage.setItem('sessionKey', encryptedKey);

      return sessionKey;
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to generate session key',
        'SESSION_KEY_GENERATION_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  public async getSessionKey(password: string): Promise<SessionKey | null> {
    try {
      const encryptedKey = this.storage.getItem('sessionKey');
      if (!encryptedKey) return null;

      const decrypted = await decrypt(encryptedKey, password);
      return JSON.parse(decrypted) as SessionKey;
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to retrieve session key',
        'SESSION_KEY_RETRIEVAL_ERROR',
        { error: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  public async connect(address: Address, chainId: number): Promise<void> {
    try {
      this.state = {
        isConnected: true,
        address,
        chainId,
        error: null
      };
    } catch (error: unknown) {
      this.state = {
        isConnected: false,
        address: null,
        chainId: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
      throw error;
    }
  }

  public async revokeAllSessions(): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      session.isActive = false;
      this.sessions.set(id, session);
    }
    this.saveSessions();
  }

  public async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  public async migrateSession(oldSessionId: string, newChainId: number): Promise<Session> {
    const oldSession = this.sessions.get(oldSessionId);
    if (!oldSession) {
      throw new Error('Session not found');
    }

    const newSession: Session = {
      ...oldSession,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      chainId: newChainId,
      isActive: true,
      lastActivity: Date.now()
    };

    this.sessions.set(newSession.id, newSession);
    this.saveSessions();
    return newSession;
  }

  async getSessionAnalytics(sessionId: string) {
    return this.analytics.getSessionMetrics(sessionId);
  }
}