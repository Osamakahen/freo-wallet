import { Session, Transaction, Analytics, SDKConfig, EventHandler } from './types';

export class SDK {
  private config: SDKConfig;
  private session: Session | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private analyticsQueue: Analytics[] = [];

  constructor(config: SDKConfig) {
    this.config = {
      autoConnect: true,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  async connect(): Promise<Session> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: this.config.rpcUrl,
          chainId: this.config.chainId,
          permissions: ['read', 'write']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      this.session = await response.json();
      this.emit('connected', this.session);
      return this.session;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.session) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${this.session.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      this.emit('disconnected', this.session);
      this.session = null;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async verifyTransaction(transaction: Transaction): Promise<boolean> {
    if (!this.session) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch('/api/transactions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.session.id,
          transaction
        })
      });

      if (!response.ok) {
        throw new Error('Transaction verification failed');
      }

      const result = await response.json();
      this.recordAnalytics('transaction_verified', { transaction, result });
      return result.valid;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async recordAnalytics(event: string, data: any): Promise<void> {
    if (!this.session) {
      this.analyticsQueue.push({
        event,
        data,
        timestamp: Date.now(),
        sessionId: ''
      });
      return;
    }

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.session.id,
          event,
          data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record analytics');
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getAnalytics(): Promise<Analytics[]> {
    if (!this.session) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`/api/analytics?sessionId=${this.session.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    const handlers = this.eventHandlers.get(event)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  private emit(event: string, data: any): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    this.eventHandlers.get(event)!.forEach(handler => handler(data));
  }
} 