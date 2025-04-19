import { AnalyticsEvent, AnalyticsError, AnalyticsPerformanceMetric, AnalyticsContext } from '../types/analytics';

class AnalyticsService {
  private static instance: AnalyticsService;
  private context: AnalyticsContext;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.context = {
      sessionId: this.sessionId,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.REACT_APP_VERSION || '1.0.0'
    };
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public setUserId(userId: string): void {
    this.context.userId = userId;
  }

  public trackEvent(event: AnalyticsEvent): void {
    const eventWithContext = {
      ...event,
      ...this.context,
      timestamp: Date.now()
    };
    console.log('Analytics Event:', eventWithContext);
    this.events.push(eventWithContext);
    // TODO: Implement actual analytics tracking
  }

  public track(eventName: string, data: any): void {
    this.trackEvent({
      type: 'custom',
      name: eventName,
      data,
      timestamp: Date.now()
    });
  }

  public trackError(error: AnalyticsError): void {
    const errorWithContext = {
      ...error,
      ...this.context,
      timestamp: Date.now()
    };
    console.error('Analytics Error:', errorWithContext);
    this.events.push({
      type: 'error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      timestamp: Date.now()
    });
    // TODO: Implement actual error tracking
  }

  public trackPerformance(metric: AnalyticsPerformanceMetric): void {
    const metricWithContext = {
      ...metric,
      ...this.context,
      timestamp: Date.now()
    };
    console.log('Analytics Performance:', metricWithContext);
    this.events.push({
      type: 'performance',
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      timestamp: Date.now()
    });
    // TODO: Implement actual performance tracking
  }

  public measurePerformance(metric: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance({
        name: metric,
        value: duration,
        unit: 'ms',
        timestamp: Date.now()
      });
    };
  }
}

export default AnalyticsService; 