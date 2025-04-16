interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkStatus: string;
  browserInfo: string;
}

interface UserContext {
  userId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  location?: string;
  timezone?: string;
}

interface ErrorContext {
  timestamp: number;
  error: Error;
  stackTrace: string;
  environment: string;
  userContext: UserContext;
  systemMetrics: SystemMetrics;
  correlationId?: string;
  relatedErrors?: string[];
}

export class EnhancedErrorReporter {
  private static instance: EnhancedErrorReporter;
  private errorHistory: Map<string, ErrorContext[]> = new Map();
  private correlationMap: Map<string, string[]> = new Map();

  private constructor() {}

  static getInstance(): EnhancedErrorReporter {
    if (!EnhancedErrorReporter.instance) {
      EnhancedErrorReporter.instance = new EnhancedErrorReporter();
    }
    return EnhancedErrorReporter.instance;
  }

  async reportError(error: Error, context: Partial<ErrorContext> = {}): Promise<string> {
    const correlationId = this.generateCorrelationId();
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      error,
      stackTrace: error.stack || '',
      environment: process.env.NODE_ENV || 'development',
      userContext: await this.getUserContext(),
      systemMetrics: await this.getSystemMetrics(),
      correlationId,
      ...context
    };

    this.storeError(fullContext);
    this.analyzeError();
    await this.sendToMonitoringService(fullContext);

    return correlationId;
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private async getUserContext(): Promise<UserContext> {
    return {
      userId: localStorage.getItem('userId') || undefined,
      sessionId: localStorage.getItem('sessionId') || undefined,
      deviceInfo: this.getDeviceInfo(),
      location: await this.getUserLocation(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth
    };
  }

  private async getUserLocation(): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return `${data.city}, ${data.country}`;
    } catch {
      return 'Unknown';
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const performanceMemory = (performance as any).memory;
    return {
      memoryUsage: performanceMemory?.usedJSHeapSize || 0,
      cpuUsage: 0, // Browser doesn't provide direct CPU usage
      networkStatus: navigator.onLine ? 'online' : 'offline',
      browserInfo: navigator.userAgent
    };
  }

  private storeError(context: ErrorContext) {
    const sessionId = context.userContext.sessionId || 'unknown';
    const errors = this.errorHistory.get(sessionId) || [];
    errors.push(context);
    this.errorHistory.set(sessionId, errors);

    if (context.correlationId) {
      this.correlationMap.set(context.correlationId, [
        ...(this.correlationMap.get(context.correlationId) || []),
        context.error.message
      ]);
    }
  }

  private analyzeError(): void {
    // Implement error analysis logic
    // - Check for similar errors in history
    // - Identify patterns
    // - Determine if it's a recurring issue
  }

  private async sendToMonitoringService(context: ErrorContext) {
    try {
      // Implement actual monitoring service integration
      console.error('Error reported to monitoring service:', {
        correlationId: context.correlationId,
        error: context.error.message,
        stackTrace: context.stackTrace,
        userContext: context.userContext,
        systemMetrics: context.systemMetrics
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  getErrorHistory(sessionId: string): ErrorContext[] {
    return this.errorHistory.get(sessionId) || [];
  }

  getCorrelatedErrors(correlationId: string): string[] {
    return this.correlationMap.get(correlationId) || [];
  }

  clearErrorHistory(sessionId: string) {
    this.errorHistory.delete(sessionId);
  }
} 