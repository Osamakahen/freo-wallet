export type ErrorSeverity = 'low' | 'medium' | 'high';

export interface ErrorContext {
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