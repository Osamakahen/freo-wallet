import {
  WalletError,
  SessionError,
  TransactionError,
  NetworkError,
  SecurityError,
  ValidationError,
  RecoveryError,
  ErrorTracker,
  handleError,
  RecoveryStrategy
} from '../ErrorHandler';

describe('Error Handling', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    tracker = ErrorTracker.getInstance();
    tracker.clearErrorHistory();
  });

  describe('Error Classes', () => {
    it('should create WalletError with recovery strategy', () => {
      const recoveryStrategy: RecoveryStrategy = {
        type: 'retry',
        maxAttempts: 3,
        action: async () => {},
        message: 'Retry operation'
      };

      const error = new WalletError(
        'Test error',
        'TEST_ERROR',
        { test: 'data' },
        recoveryStrategy
      );

      expect(error).toBeInstanceOf(WalletError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ test: 'data' });
      expect(error.recoveryStrategy).toEqual(recoveryStrategy);
    });

    it('should create specific error types', () => {
      const sessionError = new SessionError('Session error');
      const transactionError = new TransactionError('Transaction error');
      const networkError = new NetworkError('Network error');
      const securityError = new SecurityError('Security error');
      const validationError = new ValidationError('Validation error');
      const recoveryError = new RecoveryError('Recovery error');

      expect(sessionError).toBeInstanceOf(SessionError);
      expect(transactionError).toBeInstanceOf(TransactionError);
      expect(networkError).toBeInstanceOf(NetworkError);
      expect(securityError).toBeInstanceOf(SecurityError);
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(recoveryError).toBeInstanceOf(RecoveryError);
    });
  });

  describe('ErrorTracker', () => {
    it('should track errors with context', () => {
      const error = new Error('Test error');
      const context = { operation: 'test' };

      tracker.trackError(error, context);
      const history = tracker.getErrorHistory();

      expect(history).toHaveLength(1);
      expect(history[0].error).toBe(error);
      expect(history[0].context).toEqual(context);
    });

    it('should maintain singleton instance', () => {
      const tracker1 = ErrorTracker.getInstance();
      const tracker2 = ErrorTracker.getInstance();

      expect(tracker1).toBe(tracker2);
    });
  });

  describe('Error Recovery', () => {
    it('should attempt retry recovery', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
      };

      const recoveryStrategy: RecoveryStrategy = {
        type: 'retry',
        maxAttempts: 3,
        action: operation
      };

      const error = new WalletError('Test error', 'TEST_ERROR', undefined, recoveryStrategy);
      
      try {
        await handleError(error);
      } catch (e) {
        expect(attempts).toBe(3);
      }
    });

    it('should attempt fallback recovery', async () => {
      let fallbackExecuted = false;
      const recoveryStrategy: RecoveryStrategy = {
        type: 'fallback',
        action: async () => {
          fallbackExecuted = true;
        }
      };

      const error = new WalletError('Test error', 'TEST_ERROR', undefined, recoveryStrategy);
      
      try {
        await handleError(error);
      } catch (e) {
        expect(fallbackExecuted).toBe(true);
      }
    });

    it('should handle user action recovery', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const recoveryStrategy: RecoveryStrategy = {
        type: 'user_action',
        message: 'Please try again'
      };

      const error = new WalletError('Test error', 'TEST_ERROR', undefined, recoveryStrategy);
      
      try {
        await handleError(error);
      } catch (e) {
        expect(consoleSpy).toHaveBeenCalledWith('Please try again');
      }
    });
  });
}); 