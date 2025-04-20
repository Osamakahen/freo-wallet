import { describe, expect, it, jest } from '@jest/globals';
import { EnhancedSessionManager } from '../EnhancedSessionManager';
import { WalletError } from '../../error/ErrorHandler';
import { SessionManager } from '../SessionManager';
import { Session, DeviceInfo } from '../../../types/session';
import { SessionPermissions as DAppSessionPermissions } from '../../../types/dapp';

describe('EnhancedSessionManager', () => {
  let sessionManager: EnhancedSessionManager;
  let baseSessionManager: SessionManager;

  const mockDeviceInfo: DeviceInfo = {
    browser: 'test-browser',
    os: 'test-os',
    platform: 'test-platform',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    timezone: 'UTC',
    language: 'en'
  };

  const mockPermissions: DAppSessionPermissions = {
    read: true,
    write: true,
    sign: true,
    nft: true
  };

  const mockSession: Session = {
    id: 'test-session',
    timestamp: Date.now(),
    deviceInfo: mockDeviceInfo,
    deviceChanges: [],
    permissionChanges: [],
    isActive: true,
    lastActivity: Date.now(),
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    permissions: mockPermissions
  };

  beforeEach(() => {
    baseSessionManager = new SessionManager();
    sessionManager = new EnhancedSessionManager({
      tokenDuration: 3600000,
      refreshThreshold: 300000,
      maxSessions: 5,
      deviceVerification: true,
      analyticsEnabled: true,
      monitoringEnabled: true
    }, baseSessionManager);
  });

  describe('trackSessionMetrics', () => {
    it('should track session metrics correctly', async () => {
      await sessionManager.initializeSession(mockSession);
      const metrics = await sessionManager.trackSessionMetrics();
      
      expect(metrics).toHaveProperty('sessionId');
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('operations');
      expect(metrics).toHaveProperty('lastActivity');
      expect(metrics).toHaveProperty('deviceInfo');
      expect(metrics).toHaveProperty('ipAddress');
      expect(metrics).toHaveProperty('securityScore');
    });
  });

  describe('auditSession', () => {
    it('should audit session correctly', async () => {
      await sessionManager.initializeSession(mockSession);
      const auditLog = await sessionManager.auditSession('test-session');
      
      expect(auditLog).toHaveProperty('sessionId');
      expect(auditLog).toHaveProperty('timestamp');
      expect(auditLog).toHaveProperty('operations');
      expect(auditLog).toHaveProperty('securityEvents');
      expect(auditLog).toHaveProperty('deviceChanges');
      expect(auditLog).toHaveProperty('permissionChanges');
    });
  });

  describe('monitorActiveSessions', () => {
    it('should monitor active sessions correctly', async () => {
      const stats = await sessionManager.monitorActiveSessions();
      
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('securityAlerts');
      expect(stats).toHaveProperty('permissionUsage');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies correctly', async () => {
      const alerts = await sessionManager.detectAnomalies();
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('sessionId');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
      });
    });
  });

  describe('generateSessionReport', () => {
    it('should generate session report correctly', async () => {
      await sessionManager.initializeSession(mockSession);
      const report = await sessionManager.generateSessionReport();
      
      expect(report).toHaveProperty('session');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('auditLog');
      expect(report).toHaveProperty('stats');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
    });
  });
}); 