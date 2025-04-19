export type ErrorSeverity = 'low' | 'medium' | 'high';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
}

export interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkStatus: string;
  browserInfo: string;
}

export interface UserContext {
  userId?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  location?: string;
  timezone?: string;
}

export interface ErrorContext {
  error: Error;
  correlationId?: string;
  userContext?: UserContext;
  systemMetrics?: SystemMetrics;
  stackTrace?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'user_action';
  maxAttempts?: number;
  action?: () => Promise<void>;
  message?: string;
}

export interface ErrorMetrics {
  count: number;
  lastOccurrence: Date;
  severity: ErrorSeverity;
  context: ErrorContext;
}

export interface ErrorReport {
  id: string;
  message: string;
  code: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: Date;
  stackTrace?: string;
  recoveryStrategy?: RecoveryStrategy;
} 