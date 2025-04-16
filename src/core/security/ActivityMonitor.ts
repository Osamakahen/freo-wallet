import { ErrorCorrelator } from '../error/ErrorCorrelator';

export type ActivityType = 
  | 'login_attempt'
  | 'transaction'
  | 'session_change'
  | 'device_change'
  | 'location_change'
  | 'unusual_behavior';

export type ActivitySeverity = 'low' | 'medium' | 'high' | 'critical';

interface ActivityDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface ActivityEvent {
  type: ActivityType;
  timestamp: number;
  userId: string;
  sessionId: string;
  details: ActivityDetails;
  severity: ActivitySeverity;
}

interface ActivityPattern {
  type: ActivityType;
  threshold: number;
  timeWindow: number;
  severity: ActivitySeverity;
}

interface SuspiciousActivity {
  type: ActivityType;
  severity: ActivitySeverity;
  timestamp: number;
  details: {
    count: number;
    threshold: number;
    timeWindow: number;
    [key: string]: string | number | boolean | null | undefined;
  };
  userId: string;
  sessionId: string;
}

export class ActivityMonitor {
  private static instance: ActivityMonitor;
  private activityHistory: Map<string, ActivityEvent[]> = new Map();
  private patterns: ActivityPattern[] = [
    {
      type: 'login_attempt',
      threshold: 5,
      timeWindow: 5 * 60 * 1000, // 5 minutes
      severity: 'high'
    },
    {
      type: 'transaction',
      threshold: 10,
      timeWindow: 60 * 60 * 1000, // 1 hour
      severity: 'medium'
    },
    {
      type: 'device_change',
      threshold: 3,
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
      severity: 'high'
    },
    {
      type: 'location_change',
      threshold: 2,
      timeWindow: 30 * 60 * 1000, // 30 minutes
      severity: 'medium'
    }
  ];
  private errorCorrelator: ErrorCorrelator;
  private lastActivityTime: number;
  private activityTimeout: number;

  private constructor(errorCorrelator: ErrorCorrelator, timeout: number = 300000) { // 5 minutes default
    this.errorCorrelator = errorCorrelator;
    this.lastActivityTime = Date.now();
    this.activityTimeout = timeout;
  }

  static getInstance(): ActivityMonitor {
    if (!ActivityMonitor.instance) {
      const errorCorrelator = ErrorCorrelator.getInstance();
      ActivityMonitor.instance = new ActivityMonitor(errorCorrelator);
    }
    return ActivityMonitor.instance;
  }

  async trackActivity(event: Omit<ActivityEvent, 'timestamp'>): Promise<void> {
    const activityEvent: ActivityEvent = {
      ...event,
      timestamp: Date.now()
    };

    const userId = event.userId;
    const activities = this.activityHistory.get(userId) || [];
    activities.push(activityEvent);
    this.activityHistory.set(userId, activities);

    await this.analyzeActivity(activityEvent);
  }

  private async analyzeActivity(event: ActivityEvent): Promise<void> {
    const suspiciousActivities: SuspiciousActivity[] = [];
    
    // Check for pattern violations
    for (const pattern of this.patterns) {
      if (pattern.type === event.type) {
        const recentActivities = this.getRecentActivities(
          event.userId,
          pattern.type,
          pattern.timeWindow
        );

        if (recentActivities.length >= pattern.threshold) {
          suspiciousActivities.push({
            type: event.type,
            severity: pattern.severity,
            timestamp: event.timestamp,
            details: {
              count: recentActivities.length,
              threshold: pattern.threshold,
              timeWindow: pattern.timeWindow
            },
            userId: event.userId,
            sessionId: event.sessionId
          });
        }
      }
    }

    // Check for unusual behavior
    const unusualBehavior = await this.detectUnusualBehavior(event);
    if (unusualBehavior) {
      suspiciousActivities.push(unusualBehavior);
    }

    // Handle suspicious activities
    for (const activity of suspiciousActivities) {
      await this.handleSuspiciousActivity(activity);
    }
  }

  private getRecentActivities(
    userId: string,
    type: ActivityType,
    timeWindow: number
  ): ActivityEvent[] {
    const activities = this.activityHistory.get(userId) || [];
    const now = Date.now();
    
    return activities.filter(activity => 
      activity.type === type &&
      now - activity.timestamp <= timeWindow
    );
  }

  private async detectUnusualBehavior(event: ActivityEvent): Promise<SuspiciousActivity | null> {
    // Implement behavior analysis logic
    // - Check for unusual time patterns
    // - Check for unusual location patterns
    // - Check for unusual device patterns
    // - Check for unusual transaction patterns

    return null;
  }

  private async handleSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
    // Implement suspicious activity handling
    // - Log the activity
    // - Notify security team
    // - Take appropriate action based on severity

    console.warn('Suspicious activity detected:', {
      type: activity.type,
      severity: activity.severity,
      userId: activity.userId,
      sessionId: activity.sessionId,
      details: activity.details
    });

    // Example actions based on severity
    switch (activity.severity) {
      case 'critical':
        // Block account, notify security team
        break;
      case 'high':
        // Require additional verification
        break;
      case 'medium':
        // Log and monitor
        break;
      case 'low':
        // Log only
        break;
    }
  }

  async getActivityHistory(userId: string): Promise<ActivityEvent[]> {
    return this.activityHistory.get(userId) || [];
  }

  async clearActivityHistory(userId: string): Promise<void> {
    this.activityHistory.delete(userId);
  }

  async updatePatterns(patterns: ActivityPattern[]): Promise<void> {
    this.patterns = patterns;
  }

  public handleActivity(): void {
    this.lastActivityTime = Date.now();
    console.log('Activity detected:', new Date(this.lastActivityTime).toISOString());
  }

  isSessionActive(): boolean {
    return Date.now() - this.lastActivityTime < this.activityTimeout;
  }
} 