import { ErrorContext, UserContext, DeviceInfo, SystemMetrics } from '../../types/error';
import { WalletError } from './ErrorHandler';

export class EnhancedErrorReporter {
  private static instance: EnhancedErrorReporter;
  private errorHistory: Map<string, ErrorContext[]> = new Map();
  private correlationMap: Map<string, string[]> = new Map();
  private errorCount: number = 0;
  private lastErrorTime: number = 0;

  private constructor() {}

  static getInstance(): EnhancedErrorReporter {
    if (!EnhancedErrorReporter.instance) {
      EnhancedErrorReporter.instance = new EnhancedErrorReporter();
    }
    return EnhancedErrorReporter.instance;
  }

  public async reportError(error: Error, context: ErrorContext): Promise<void> {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    if (error instanceof WalletError) {
      await this.handleWalletError(error, context);
    } else {
      await this.handleGenericError(error, context);
    }
  }

  private async handleWalletError(error: WalletError, context: ErrorContext): Promise<void> {
    // Enhanced error handling for wallet-specific errors
    console.error('Wallet Error:', {
      message: error.message,
      code: error.code,
      context: context,
      timestamp: new Date().toISOString()
    });
  }

  private async handleGenericError(error: Error, context: ErrorContext): Promise<void> {
    // Enhanced error handling for generic errors
    console.error('Generic Error:', {
      message: error.message,
      context: context,
      timestamp: new Date().toISOString()
    });
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