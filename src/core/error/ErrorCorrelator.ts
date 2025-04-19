import { WalletError } from './ErrorHandler';
import { ErrorContext, ErrorSeverity } from '../../types/error';
import { AnalyticsService } from '../analytics/AnalyticsService';

export interface ErrorPattern {
  type: string;
  message: string;
  stackTrace: string;
  frequency: number;
  lastOccurrence: number;
}

export interface ErrorCorrelation {
  correlationId: string;
  rootCause: string;
  relatedErrors: string[];
  pattern?: ErrorPattern;
  severity: ErrorSeverity;
  timestamp: number;
  context: ErrorContext;
}

export class ErrorCorrelator {
  private static instance: ErrorCorrelator;
  private errorMap: Map<string, WalletError[]> = new Map();
  private correlations: Map<string, ErrorCorrelation> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private analyticsService: AnalyticsService;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  static getInstance(): ErrorCorrelator {
    if (!ErrorCorrelator.instance) {
      ErrorCorrelator.instance = new ErrorCorrelator();
    }
    return ErrorCorrelator.instance;
  }

  async correlateError(error: WalletError): Promise<void> {
    try {
      const errorId = this.generateErrorKey(error);
      const timestamp = Date.now();
      
      const errorData = [error];
      
      this.errorMap.set(errorId, errorData);
      await this.analyticsService.trackError({
        error,
        correlationId: errorId,
        timestamp,
        context: {
          error: error,
          timestamp,
          stackTrace: error.stack
        }
      });
    } catch (e) {
      console.error('Failed to correlate error:', e);
    }
  }

  private getErrorKey(error: WalletError): string {
    return `${error.code}-${error.message}`;
  }

  getErrors(): Map<string, WalletError[]> {
    return this.errorMap;
  }

  clearErrors(): void {
    this.errorMap.clear();
  }

  async correlateErrorPattern(error: Error | WalletError, context: ErrorContext = { error: new Error('Unknown error') }): Promise<ErrorCorrelation> {
    const correlationId = this.generateCorrelationId();
    const pattern = await this.analyzeErrorPattern(error);
    const relatedErrors = await this.findRelatedErrors(error);

    const correlation: ErrorCorrelation = {
      correlationId,
      rootCause: this.determineRootCause(error, relatedErrors),
      relatedErrors: relatedErrors.map(e => e.message),
      pattern,
      severity: this.determineSeverity(error, pattern),
      timestamp: Date.now(),
      context
    };

    const walletError = error instanceof WalletError 
      ? new WalletError(
          error.message,
          error.code,
          { ...error.context, ...context },
          error.severity,
          error.recoveryStrategy
        )
      : new WalletError(error.message, undefined, context);

    this.correlations.set(correlationId, correlation);
    this.errorMap.set(correlationId, [walletError]);
    
    await this.analyticsService.trackError({
      error: walletError,
      correlationId,
      timestamp: Date.now(),
      context
    });

    return correlation;
  }

  getCorrelatedErrors(correlationId: string): WalletError[] {
    return this.errorMap.get(correlationId) || [];
  }

  getCorrelation(correlationId: string): ErrorCorrelation | undefined {
    return this.correlations.get(correlationId);
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateErrorKey(error: Error): string {
    return `${error.constructor.name}:${error.message}`;
  }

  private async analyzeErrorPattern(error: Error): Promise<ErrorPattern | undefined> {
    const errorKey = this.generateErrorKey(error);
    const pattern = this.patterns.get(errorKey);

    if (pattern) {
      pattern.frequency++;
      pattern.lastOccurrence = Date.now();
      return pattern;
    }

    const newPattern: ErrorPattern = {
      type: error.constructor.name,
      message: error.message,
      stackTrace: error.stack || '',
      frequency: 1,
      lastOccurrence: Date.now()
    };
    this.patterns.set(errorKey, newPattern);
    return newPattern;
  }

  private async findRelatedErrors(error: Error): Promise<Error[]> {
    const errorHistory = Array.from(this.errorMap.values()).flat();
    return errorHistory.filter(e => 
      this.isRelatedError(e, error) &&
      Date.now() - (e instanceof WalletError ? e.timestamp : 0) < 24 * 60 * 60 * 1000 // Last 24 hours
    );
  }

  private isRelatedError(error1: Error, error2: Error): boolean {
    return (
      error1.constructor.name === error2.constructor.name ||
      this.similarityScore(error1.message, error2.message) > 0.7 ||
      this.stackTraceSimilarity(error1.stack || '', error2.stack || '') > 0.6
    );
  }

  private determineRootCause(error: Error, relatedErrors: Error[]): string {
    if (relatedErrors.length === 0) {
      return error.message;
    }
    return relatedErrors[0].message;
  }

  private determineSeverity(error: Error, pattern?: ErrorPattern): ErrorSeverity {
    if (error instanceof WalletError) {
      return error.severity;
    }
    if (pattern && pattern.frequency > 10) {
      return 'high';
    }
    return 'medium';
  }

  private similarityScore(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - this.editDistance(longer, shorter)) / longerLength;
  }

  private editDistance(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private stackTraceSimilarity(stack1: string, stack2: string): number {
    const lines1 = stack1.split('\n');
    const lines2 = stack2.split('\n');
    let matches = 0;
    for (const line1 of lines1) {
      for (const line2 of lines2) {
        if (this.similarityScore(line1, line2) > 0.8) {
          matches++;
          break;
        }
      }
    }
    return matches / Math.max(lines1.length, lines2.length);
  }

  addContext(errorId: string, context: Record<string, unknown>): void {
    const errors = this.errorMap.get(errorId);
    if (errors && errors.length > 0) {
      errors.forEach(error => {
        error.context = { ...error.context, ...context };
      });
    }
  }
} 