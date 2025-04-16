import { ErrorSeverity, ErrorContext, RecoveryStrategy } from '../../types/error';

export class WalletError extends Error {
  public timestamp: number;

  constructor(
    message: string,
    public code?: string,
    public context: ErrorContext = {},
    public severity: ErrorSeverity = 'medium',
    public recoveryStrategy?: RecoveryStrategy
  ) {
    super(message);
    this.name = 'WalletError';
    this.timestamp = Date.now();
  }
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'user_action';
  maxAttempts?: number;
  action?: () => Promise<void>;
  message?: string;
}

export class SessionError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'SESSION_ERROR', context, 'error', recoveryStrategy);
  }
}

export class TransactionError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'TRANSACTION_ERROR', context, 'error', recoveryStrategy);
  }
}

export class NetworkError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'NETWORK_ERROR', context, 'error', recoveryStrategy);
  }
}

export class SecurityError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'SECURITY_ERROR', context, 'critical', recoveryStrategy);
  }
}

export class ValidationError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'VALIDATION_ERROR', context, 'warning', recoveryStrategy);
  }
}

export class RecoveryError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'RECOVERY_ERROR', context, 'error', recoveryStrategy);
  }
}

export class DAppError extends WalletError {
  constructor(message: string, context: ErrorContext = {}, recoveryStrategy?: RecoveryStrategy) {
    super(message, 'DAPP_ERROR', context, 'error', recoveryStrategy);
  }
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    error: Error;
    timestamp: number;
    context: ErrorContext;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  trackError(error: Error, context: ErrorContext = {}): void {
    this.errors.push({
      error,
      timestamp: Date.now(),
      context
    });

    this.reportError(error, context);
  }

  private async reportError(error: Error, context: ErrorContext): Promise<void> {
    try {
      console.error('Error reported:', {
        error: error.message,
        stack: error.stack,
        context
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  getErrorHistory(): Array<{
    error: Error;
    timestamp: number;
    context: ErrorContext;
  }> {
    return this.errors;
  }

  clearErrorHistory(): void {
    this.errors = [];
  }
}

export function handleError(error: unknown, context: ErrorContext = {}): WalletError {
  if (error instanceof WalletError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  return new WalletError(message, 'UNKNOWN_ERROR', {
    ...context,
    originalError: error
  });
}

export function isErrorOfType(error: unknown, type: ErrorType): boolean {
  if (!(error instanceof WalletError)) {
    return false;
  }
  return error.code === type;
}

export function getErrorContext(error: unknown): ErrorContext {
  if (error instanceof WalletError) {
    return error.context;
  }
  return {
    originalError: error
  };
}

export const attemptRecovery = async (error: WalletError): Promise<void> => {
  const { recoveryStrategy } = error;
  if (!recoveryStrategy) return;

  switch (recoveryStrategy.type) {
    case 'retry':
      if (recoveryStrategy.maxAttempts && recoveryStrategy.maxAttempts > 0 && recoveryStrategy.action) {
        await retryOperation(recoveryStrategy.action, recoveryStrategy.maxAttempts);
      }
      break;
    case 'fallback':
      if (recoveryStrategy.action) {
        await recoveryStrategy.action();
      }
      break;
    case 'user_action':
      if (recoveryStrategy.message) {
        console.log(recoveryStrategy.message);
      }
      break;
  }
};

const retryOperation = async (
  operation: () => Promise<void>,
  maxAttempts: number,
  delay = 1000
): Promise<void> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      await operation();
      return;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorMap: Map<string, WalletError> = new Map();

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown): WalletError {
    if (error instanceof WalletError) {
      return error;
    }

    if (error instanceof Error) {
      return new WalletError(error.message);
    }

    return new WalletError('An unknown error occurred');
  }

  registerError(code: string, error: WalletError): void {
    this.errorMap.set(code, error);
  }

  getError(code: string): WalletError | undefined {
    return this.errorMap.get(code);
  }
} 