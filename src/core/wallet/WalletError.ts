export class WalletError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
    this.details = details;
  }
} 