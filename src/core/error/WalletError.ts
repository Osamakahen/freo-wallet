export class WalletError extends Error {
  timestamp: Date;
  context: string;
  severity: 'low' | 'medium' | 'high';

  constructor(message: string, context: string = 'wallet', severity: 'low' | 'medium' | 'high' = 'medium') {
    super(message);
    this.name = 'WalletError';
    this.timestamp = new Date();
    this.context = context;
    this.severity = severity;
  }
} 