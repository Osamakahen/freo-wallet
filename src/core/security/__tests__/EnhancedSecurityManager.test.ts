import { EnhancedSecurityManager } from '../EnhancedSecurityManager';
import { SecurityAlert, SecurityEvent } from '../../../types/security';

describe('EnhancedSecurityManager', () => {
  let securityManager: EnhancedSecurityManager;
  const mockAlert: SecurityAlert = {
    type: 'HIGH_OPERATION_COUNT',
    sessionId: 'test-session',
    severity: 'CRITICAL',
    message: 'Test alert message',
    timestamp: Date.now(),
    details: {
      source: 'test',
      details: 'Test details'
    }
  };

  beforeEach(() => {
    securityManager = new EnhancedSecurityManager();
  });

  describe('detectThreats', () => {
    it('should detect threats correctly', async () => {
      const threats = await securityManager.detectThreats();
      expect(Array.isArray(threats)).toBe(true);
      threats.forEach((threat: SecurityAlert) => {
        expect(threat).toHaveProperty('type');
        expect(threat).toHaveProperty('sessionId');
        expect(threat).toHaveProperty('severity');
      });
    });
  });

  describe('analyzeBehavior', () => {
    it('should analyze behavior patterns correctly', async () => {
      const analysis = await securityManager.analyzeBehavior();
      expect(analysis).toHaveProperty('riskScore');
      expect(analysis).toHaveProperty('anomalies');
      expect(analysis).toHaveProperty('recommendations');
    });
  });

  describe('enforceSecurityPolicy', () => {
    it('should enforce security policies correctly', async () => {
      const result = await securityManager.enforceSecurityPolicy({
        rateLimitWindow: 60000,
        maxRequests: 100,
        securityScoreThreshold: 0.7,
        deviceChangeLimit: 3,
        sessionTimeout: 3600000
      });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('actions');
    });
  });

  describe('monitorSecurityEvents', () => {
    it('should monitor security events correctly', async () => {
      const events = await securityManager.monitorSecurityEvents();
      expect(Array.isArray(events)).toBe(true);
      events.forEach((event: SecurityEvent) => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('details');
      });
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate security reports correctly', async () => {
      const report = await securityManager.generateSecurityReport();
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recentAlerts');
      expect(report).toHaveProperty('deviceHistory');
      expect(report).toHaveProperty('securityEvents');
      expect(report).toHaveProperty('recommendations');
    });
  });

  describe('handleSecurityAlert', () => {
    it('should handle security alerts correctly', async () => {
      const result = await securityManager.handleSecurityAlert(mockAlert);
      expect(result).toHaveProperty('handled');
      expect(result).toHaveProperty('actions');
    });
  });

  describe('getSecurityMetrics', () => {
    it('should get security metrics correctly', async () => {
      const metrics = await securityManager.getSecurityMetrics();
      expect(metrics).toHaveProperty('totalAlerts');
      expect(metrics).toHaveProperty('criticalAlerts');
      expect(metrics).toHaveProperty('warningAlerts');
      expect(metrics).toHaveProperty('averageSecurityScore');
      expect(metrics).toHaveProperty('deviceChanges');
      expect(metrics).toHaveProperty('rateLimitViolations');
    });
  });
}); 