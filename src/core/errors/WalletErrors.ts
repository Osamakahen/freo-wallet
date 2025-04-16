export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

export class WalletInitError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'WalletInitError';
  }
}

export class TransactionError extends WalletError {
  constructor(message: string, public readonly txHash?: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class NetworkError extends WalletError {
  constructor(message: string, public readonly chainId?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class SecurityError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class DAppError extends WalletError {
  constructor(message: string, public readonly dappId?: string) {
    super(message);
    this.name = 'DAppError';
  }
}

export class ValidationError extends WalletError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
} 