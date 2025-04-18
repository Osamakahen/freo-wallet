import { Session } from '../types/session';
import { SecurityEvent } from '../types/security';
import { TransactionRequest } from '../types/transaction';

export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  properties: Record<string, string | number | boolean>;
  context: {
    deviceId: string;
    sessionId: string;
    network: string;
  };
}

export interface Analytics {
  event: AnalyticsEvent;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export class FreoSDK {
  private session: Session | null = null;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  async connect(): Promise<Session> {
    // Implementation
    return {} as Session;
  }

  async disconnect(): Promise<void> {
    // Implementation
  }

  async verifyTransaction(transaction: TransactionRequest): Promise<boolean> {
    // Implementation
    return true;
  }

  async recordAnalytics(event: string, data: Record<string, string | number | boolean>): Promise<void> {
    // Implementation
  }

  async getAnalytics(): Promise<Analytics[]> {
    // Implementation
    return [];
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }
} 