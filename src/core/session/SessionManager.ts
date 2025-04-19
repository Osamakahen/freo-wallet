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
import { AnalyticsService } from '../../services/AnalyticsService';
import { DeviceFingerprint } from '../security/DeviceFingerprint';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private keyManager: SessionKeyManager;
  private tokenManager: SessionTokenManager;
  private enhancedManager: EnhancedSessionManager;
  private config: SessionConfig & { sessionDuration: number };
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
    this.keyManager = new SessionKeyManager();
    this.tokenManager = new SessionTokenManager();
    this.enhancedManager = new EnhancedSessionManager();
    this.config = {
      sessionDuration: 300000 // 5 minutes in milliseconds
    };
    this.storage = window.localStorage;
    this.state = {
      isActive: false,
      lastActivity: Date.now(),
      permissions: new Set()
    };
    this.deviceInfo = this.getDeviceInfo();
    this.analytics = new SessionAnalytics();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.securityService = new SecurityService();
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
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    };
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
    await this.keyManager.deleteSessionKey(sessionId);
    await this.tokenManager.revokeSessionToken(sessionId);
    await this.enhancedManager.endSession(sessionId);
    this.sessions.delete(sessionId);
    this.saveSessions();
  }

  public async refreshSession(sessionId: string, deviceInfo: DeviceInfo): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (this.config.deviceVerification) {
      // Verify device info matches
      const deviceMatches = this.verifyDeviceInfo(session.deviceInfo!, deviceInfo);
      if (!deviceMatches) {
        throw new Error('Device verification failed');
      }
    }

    const updatedSession: Session = {
      ...session,
      expiresAt: new Date(Date.now() + this.config.tokenDuration * 1000),
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, updatedSession);
    this.saveSessions();
    return updatedSession;
  }

  private verifyDeviceInfo(stored: DeviceInfo, current: DeviceInfo): boolean {
    return (
      stored.userAgent === current.userAgent &&
      stored.platform === current.platform &&
      stored.language === current.language
    );
  }

  public getActiveSession(): Session | null {
    const now = new Date();
    for (const session of this.sessions.values()) {
      if (session.expiresAt > now) {
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
    
    // Set expiry for recovery token
    setTimeout(() => {
      this.recoveryTokens.delete(token);
    }, this.config.recoveryTokenDuration * 1000);
    
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
      const key = generateRandomBytes(32);
      const salt = generateRandomBytes(16);
      const now = Date.now();

      const sessionKey: SessionKey = {
        key: key.toString('hex'),
        salt: salt.toString('hex'),
        createdAt: now,
        expiresAt: now + this.config.tokenDuration
      };

      // Encrypt session key before storing
      const encryptedKey = await encrypt(JSON.stringify(sessionKey), password);
      this.storage.setItem('sessionKey', encryptedKey);

      return sessionKey;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate session key: ${errorMessage}`);
    }
  }

  public async getSessionKey(password: string): Promise<SessionKey | null> {
    try {
      const encryptedKey = this.storage.getItem('sessionKey');
      if (!encryptedKey) return null;

      const decryptedKey = await decrypt(encryptedKey, password);
      const sessionKey: SessionKey = JSON.parse(decryptedKey);

      if (Date.now() > sessionKey.expiresAt) {
        this.storage.removeItem('sessionKey');
        return null;
      }

      return sessionKey;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve session key: ${errorMessage}`);
    }
  }

  public async connect(address: Address, chainId: number): Promise<void> {
    this.state = {
      ...this.state,
      isActive: true,
      address,
      chainId,
      error: null
    };
  }

  public async revokeAllSessions(): Promise<void> {
    try {
      this.sessions.clear();
      this.activeSessionId = null;
      this.saveSessions();
    } catch (error) {
      throw new Error(`Failed to revoke all sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async getSessions(): Promise<Session[]> {
    try {
      return Array.from(this.sessions.values());
    } catch (error) {
      throw new Error(`Failed to get sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async migrateSession(oldSessionId: string, newChainId: number): Promise<Session> {
    const session = this.sessions.get(oldSessionId);
    if (!session) {
      throw new WalletError('Session not found');
    }

    const newSession: Session = {
      ...session,
      chainId: newChainId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionDuration)
    };

    this.sessions.set(newSession.id, newSession);
    this.saveSessions();
    return newSession;
  }

  async getSessionAnalytics(sessionId: string) {
    return this.analytics.getSessionMetrics(sessionId);
  }
}