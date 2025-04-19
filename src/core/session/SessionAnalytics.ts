import { DeviceInfo } from '../../types/session';
import AnalyticsService from '../../services/AnalyticsService';

interface SessionMetrics {
  startTime: number;
  duration: number;
  events: string[];
  activityCount: number;
  deviceChanges: number;
  chainSwitches: number;
  recoveryAttempts: number;
  lastActivity: number;
}

export class SessionAnalytics {
  private analytics: AnalyticsService;
  private metrics: Map<string, SessionMetrics> = new Map();

  constructor() {
    this.analytics = AnalyticsService.getInstance();
  }

  private initializeMetrics(sessionId: string) {
    if (!this.metrics.has(sessionId)) {
      this.metrics.set(sessionId, {
        startTime: Date.now(),
        duration: 0,
        events: [],
        activityCount: 0,
        deviceChanges: 0,
        chainSwitches: 0,
        recoveryAttempts: 0,
        lastActivity: Date.now()
      });
    }
  }

  trackSessionActivity(sessionId: string) {
    this.initializeMetrics(sessionId);
    const metrics = this.metrics.get(sessionId)!;
    metrics.activityCount++;
    metrics.lastActivity = Date.now();
  }

  trackSessionRecovery(sessionId: string) {
    this.initializeMetrics(sessionId);
    const metrics = this.metrics.get(sessionId)!;
    metrics.recoveryAttempts++;
    metrics.deviceChanges++;
  }

  async trackSessionMigration(oldSessionId: string, newSessionId?: string): Promise<void> {
    this.initializeMetrics(oldSessionId);
    const metrics = this.metrics.get(oldSessionId)!;
    metrics.chainSwitches++;

    if (newSessionId) {
      await this.analytics.trackEvent({
        type: 'custom',
        name: 'session_migrated',
        data: { oldSessionId, newSessionId },
        timestamp: Date.now()
      });
    }
  }

  async trackSessionCreation(sessionId: string): Promise<void> {
    await this.analytics.trackEvent({
      type: 'custom',
      name: 'session_created',
      data: { sessionId },
      timestamp: Date.now()
    });
  }

  async trackSessionError(sessionId: string): Promise<void> {
    await this.analytics.trackEvent({
      type: 'error',
      name: 'session_error',
      data: { sessionId },
      timestamp: Date.now()
    });
  }

  startSessionMetrics(sessionId: string): void {
    this.initializeMetrics(sessionId);
  }

  endSessionMetrics(sessionId: string): void {
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      metrics.duration = Date.now() - metrics.startTime;
    }
  }

  trackSessionEvent(sessionId: string, event: string): void {
    this.initializeMetrics(sessionId);
    const metrics = this.metrics.get(sessionId)!;
    metrics.events.push(event);
  }

  getSessionMetrics(sessionId: string): SessionMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  clearSessionData(sessionId: string) {
    this.metrics.delete(sessionId);
  }
} 