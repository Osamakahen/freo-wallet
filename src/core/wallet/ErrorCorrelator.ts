export class ErrorCorrelator {
  private static instance: ErrorCorrelator;
  private errorMap: Map<string, string>;

  private constructor() {
    this.errorMap = new Map();
    this.initializeErrorMap();
  }

  public static getInstance(): ErrorCorrelator {
    if (!ErrorCorrelator.instance) {
      ErrorCorrelator.instance = new ErrorCorrelator();
    }
    return ErrorCorrelator.instance;
  }

  private initializeErrorMap(): void {
    // Common wallet errors
    this.errorMap.set('NO_PROVIDER', 'No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    this.errorMap.set('USER_REJECTED', 'User rejected the request.');
    this.errorMap.set('INVALID_CHAIN', 'Invalid chain ID. Please switch to a supported network.');
    this.errorMap.set('INSUFFICIENT_FUNDS', 'Insufficient funds for transaction.');
    this.errorMap.set('INVALID_ADDRESS', 'Invalid Ethereum address.');
    this.errorMap.set('TRANSACTION_FAILED', 'Transaction failed. Please try again.');
    this.errorMap.set('SIGNATURE_REJECTED', 'User rejected the signature request.');
  }

  public correlateError(error: any): string {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // Check for common error patterns
      if (errorMessage.includes('user denied')) {
        return this.errorMap.get('USER_REJECTED') || error.message;
      }
      if (errorMessage.includes('insufficient funds')) {
        return this.errorMap.get('INSUFFICIENT_FUNDS') || error.message;
      }
      if (errorMessage.includes('invalid address')) {
        return this.errorMap.get('INVALID_ADDRESS') || error.message;
      }
      if (errorMessage.includes('transaction failed')) {
        return this.errorMap.get('TRANSACTION_FAILED') || error.message;
      }
    }
    
    return error.message || 'An unknown error occurred';
  }
} 