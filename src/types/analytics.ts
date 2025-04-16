export interface AnalyticsEvent {
  type: string;
  name: string;
  message?: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  [key: string]: any;
}

export interface AnalyticsError {
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
}

export interface AnalyticsPerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface AnalyticsContext {
  userId?: string;
  sessionId: string;
  environment: string;
  version: string;
  [key: string]: any;
} 