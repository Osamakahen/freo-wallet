import React from 'react';
import { WalletError } from '../../core/errors/WalletErrors';

interface ErrorMessageProps {
  error: Error | string | null;
  className?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  className = '',
  onDismiss
}) => {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;
  const errorType = error instanceof WalletError ? error.name : 'Error';

  return (
    <div className={`error-message ${className}`} role="alert">
      <div className="error-content">
        <span className="error-type">{errorType}</span>
        <span className="error-text">{errorMessage}</span>
        {onDismiss && (
          <button
            className="error-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}; 