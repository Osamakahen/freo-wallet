import { Address } from 'viem';
import { encrypt, decrypt } from '../../utils/crypto';
import { Session, SessionConfig, DeviceInfo, DeviceChange, PermissionChange } from '../../types/session';
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

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private recoveryTokens: Map<string, string> = new Map();
  private keyManager: SessionKeyManager;
  private tokenManager: SessionTokenManager;
  private enhancedManager: EnhancedSessionManager;
  private config: SessionConfig;
  private storage: Storage;
  private deviceInfo: DeviceInfo;
  private activeSessionId: string | null = null;
  private readonly STORAGE_KEY = 'freo_sessions';
  private analytics: SessionAnalytics;
  private securityService: SecurityService;
  private errorCorrelator: ErrorCorrelator;

  constructor() {
    this.keyManager = SessionKeyManager.getInstance();
    this.tokenManager = SessionTokenManager.getInstance();
    this.enhancedManager = new EnhancedSessionManager();
    this.config = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      tokenDuration: 1 * 60 * 60 * 1000, // 1 hour
      deviceVerification: true
    };
    this.storage = window.localStorage;
    this.deviceInfo = this.getDeviceInfo();
    this.analytics = new SessionAnalytics();
    this.securityService = SecurityService.getInstance();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.loadSessions();
  }

  private loadSessions(): void {
    const stored = this.storage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const rawSessions = JSON.parse(stored);
        this.sessions = new Map(
          Object.entries(rawSessions).map(([id, session]: [string, any]) => [
            id,
            {
              id,
              timestamp: session.timestamp || Date.now(),
              deviceInfo: session.deviceInfo || this.deviceInfo,
              deviceChanges: session.deviceChanges || [],
              permissionChanges: session.permissionChanges || [],
              isActive: session.isActive || false,
              lastActivity: session.lastActivity || Date.now(),
              address: session.address as Address,
              chainId: session.chainId,
              permissions: session.permissions || {
                read: true,
                write: true,
                sign: true,
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
      deviceType: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private generateDeviceFingerprint(): string {
    const deviceString = JSON.stringify(this.deviceInfo);
    return createHash('sha256').update(deviceString).digest('hex');
  }

  async createSession(options: { chainId: number; address: Address }): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
      deviceChanges: [],
      permissionChanges: [],
      isActive: true,
      lastActivity: Date.now(),
      address: options.address,
      chainId: options.chainId,
      permissions: {
        read: true,
        write: true,
        sign: true,
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

    const token = uuidv4();
    this.recoveryTokens.set(token, sessionId);
    
    // Set expiry for recovery token
    setTimeout(() => {
      this.recoveryTokens.delete(token);
    }, 24 * 60 * 60 * 1000); // 24 hours

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

    // Implementation for session approval
    return true;
  }

  public disconnect(): void {
    this.sessions.clear();
    this.saveSessions();
  }

  public getState(): { sessions: Session[] } {
    return {
      sessions: Array.from(this.sessions.values())
    };
  }

  public getConfig(): SessionConfig {
    return this.config;
  }

  public async generateSessionKey(password: string): Promise<string> {
    return this.keyManager.generateSessionKey(password);
  }

  public async getSessionKey(password: string): Promise<string | null> {
    return this.keyManager.getSessionKey(password);
  }

  public async connect(address: Address, chainId: number): Promise<void> {
    const session = await this.createSession({ address, chainId });
    this.activeSessionId = session.id;
  }

  public async revokeAllSessions(): Promise<void> {
    for (const sessionId of this.sessions.keys()) {
      await this.endSession(sessionId);
    }
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
      id: uuidv4(),
      chainId: newChainId,
      timestamp: Date.now()
    };

    this.sessions.set(newSession.id, newSession);
    this.sessions.delete(oldSessionId);
    this.saveSessions();

    return newSession;
  }

  async getSessionAnalytics(sessionId: string) {
    return this.analytics.getSessionAnalytics(sessionId);
  }
}