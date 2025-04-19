import { 
  SessionMetrics, 
  SessionAuditLog, 
  SessionStats, 
  SessionReport, 
  PermissionChange,
  Session,
  SessionConfig,
  DeviceChange,
  DeviceInfo
} from '../../types/session';
import { SessionManager } from './SessionManager';
import AnalyticsService from '../../services/AnalyticsService';
import { SecurityManager } from '../security/SecurityManager';
import { SecurityAlert } from '../../types/security';
import { v4 as uuidv4 } from 'uuid';

// AnalyticsService implementation
class AnalyticsService {
  private static instance: AnalyticsService;
  
  private constructor() {}
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  public async track(event: string, data: any): Promise<void> {
    // Implementation for tracking analytics
    console.log(`Tracking ${event}:`, data);
  }
}

export class EnhancedSessionManager extends SessionManager {
  private analyticsService: AnalyticsService;
  private securityManager: SecurityManager;
  private sessionMetrics: Map<string, SessionMetrics> = new Map();
  private auditLogs: Map<string, SessionAuditLog[]> = new Map();

  constructor(config: SessionConfig) {
    super(config);
    this.analyticsService = AnalyticsService.getInstance();
    this.securityManager = new SecurityManager();
  }

  public async trackSessionMetrics(): Promise<SessionMetrics> {
    const activeSession = this.getActiveSession();
    if (!activeSession) {
      throw new Error('No active session');
    }

    const deviceInfo = this.getDeviceInfo();
    const metrics: SessionMetrics = {
      sessionId: activeSession.id,
      duration: Date.now() - activeSession.timestamp,
      operations: this.getSessionOperations(),
      lastActivity: Date.now(),
      deviceInfo,
      ipAddress: await this.securityManager.getIPAddress(),
      securityScore: await this.securityManager.calculateSecurityScore(activeSession.id)
    };

    this.sessionMetrics.set(activeSession.id, metrics);
    await this.analyticsService.track('session_metrics', metrics);
    return metrics;
  }

  public async auditSession(sessionId: string): Promise<SessionAuditLog> {
    const session = await this.getSessions().then(sessions => 
      sessions.find(s => s.id === sessionId)
    );
    
    if (!session) {
      throw new Error('Session not found');
    }

    const deviceChanges: DeviceChange[] = (await this.securityManager.getDeviceChanges(sessionId)).map(change => ({
      timestamp: Date.now(),
      type: 'browser' as const,
      oldValue: JSON.stringify(change),
      newValue: JSON.stringify(this.getDeviceInfo())
    }));

    const auditLog: SessionAuditLog = {
      sessionId,
      timestamp: Date.now(),
      operations: this.getSessionOperations(),
      securityEvents: await this.securityManager.getSecurityEvents(sessionId),
      deviceChanges,
      permissionChanges: this.getPermissionChanges()
    };

    const logs = this.auditLogs.get(sessionId) || [];
    logs.push(auditLog);
    this.auditLogs.set(sessionId, logs);

    return auditLog;
  }

  public async monitorActiveSessions(): Promise<SessionStats> {
    const sessions = await this.getSessions();
    const activeSessions = sessions.filter(session => session.isActive);
    
    const stats: SessionStats = {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      averageDuration: this.calculateAverageDuration(activeSessions),
      securityAlerts: await this.detectAnomalies(),
      permissionUsage: this.analyzePermissionUsage()
    };

    await this.analyticsService.track('session_stats', stats);
    return stats;
  }

  private calculateAverageDuration(sessions: Session[]): number {
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (Date.now() - session.timestamp);
    }, 0);
    
    return totalDuration / sessions.length;
  }

  private calculateSecurityScore(sessions: Session[]): number {
    if (sessions.length === 0) return 100;
    
    const totalScore = sessions.reduce((sum, session) => {
      const deviceChanges = session.deviceChanges?.length || 0;
      const permissionChanges = session.permissionChanges?.length || 0;
      return sum + (100 - (deviceChanges * 10 + permissionChanges * 5));
    }, 0);
    
    return Math.max(0, Math.min(100, totalScore / sessions.length));
  }

  public async detectAnomalies(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const sessions = await this.getSessions();
    
    for (const session of sessions) {
      const metrics = this.sessionMetrics.get(session.id);
      if (!metrics) continue;

      // Check for unusual activity
      if (metrics.operations > 1000) {
        alerts.push({
          type: 'HIGH_OPERATION_COUNT',
          sessionId: session.id,
          severity: 'WARNING',
          message: 'Unusually high number of operations detected',
          timestamp: Date.now()
        });
      }

      // Check for multiple device changes
      const deviceChanges = await this.securityManager.getDeviceChanges(session.id);
      if (deviceChanges.length > 3) {
        alerts.push({
          type: 'MULTIPLE_DEVICE_CHANGES',
          sessionId: session.id,
          severity: 'CRITICAL',
          message: 'Multiple device changes detected',
          timestamp: Date.now()
        });
      }

      // Check for security score
      if (metrics.securityScore < 0.7) {
        alerts.push({
          type: 'LOW_SECURITY_SCORE',
          sessionId: session.id,
          severity: 'WARNING',
          message: 'Low security score detected',
          timestamp: Date.now()
        });
      }
    }

    return alerts;
  }

  public async generateSessionReport(): Promise<SessionReport> {
    const activeSession = await this.getActiveSession();
    if (!activeSession) {
      throw new Error('No active session');
    }

    const metrics = await this.trackSessionMetrics();
    const auditLog = await this.auditSession(activeSession.id);
    const stats = await this.monitorActiveSessions();
    const alerts = await this.detectAnomalies();

    return {
      session: activeSession,
      metrics,
      auditLog,
      stats,
      alerts,
      recommendations: this.generateRecommendations(metrics, alerts)
    };
  }

  private getSessionOperations(): number {
    // Implementation to track session operations
    return 0; // Placeholder
  }

  private getPermissionChanges(): PermissionChange[] {
    // Implementation to track permission changes
    return []; // Placeholder
  }

  private analyzePermissionUsage(): Map<string, number> {
    const usage = new Map<string, number>();
    // Implementation to analyze permission usage
    return usage;
  }

  private generateRecommendations(metrics: SessionMetrics, alerts: SecurityAlert[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.securityScore < 0.7) {
      recommendations.push('Consider enabling two-factor authentication');
    }
    
    if (alerts.some(a => a.type === 'MULTIPLE_DEVICE_CHANGES')) {
      recommendations.push('Review recent device changes for suspicious activity');
    }
    
    return recommendations;
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

  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return '';
    }
  }
} 