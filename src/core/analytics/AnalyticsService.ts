import { ErrorContext } from '../../types/error';
import { WalletError } from '../error/ErrorHandler';

interface ErrorTrackingData {
  error: WalletError;
  correlationId: string;
  timestamp: number;
  context: ErrorContext;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async trackError(data: ErrorTrackingData): Promise<void> {
    try {
      console.error('Error tracked:', {
        error: data.error.message,
        code: data.error.code,
        correlationId: data.correlationId,
        timestamp: data.timestamp,
        stack: data.error.stack,
        context: data.context
      });
      // In a real implementation, this would send the error data to an analytics service
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }
} 