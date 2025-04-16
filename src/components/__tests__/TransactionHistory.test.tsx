import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionHistory from '../TransactionHistory';
import { TransactionManager } from '../../core/transaction/TransactionManager';
import { TransactionReceipt } from '../../types/wallet';

describe('TransactionHistory', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const mockTransactionManager = {
    getTransactionHistory: vi.fn()
  } as unknown as TransactionManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    mockTransactionManager.getTransactionHistory.mockImplementation(() => new Promise(() => {}));
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('should display error message when loading fails', async () => {
    mockTransactionManager.getTransactionHistory.mockRejectedValueOnce(new Error('Failed to load'));
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load transaction history')).toBeInTheDocument();
    });
  });

  it('should display "No transactions found" when there are no transactions', async () => {
    mockTransactionManager.getTransactionHistory.mockResolvedValueOnce([]);
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  it('should display transaction details when transactions are loaded', async () => {
    const mockTransactions: TransactionReceipt[] = [
      {
        hash: '0x123',
        from: '0x123',
        to: mockAddress,
        blockNumber: 12345,
        gasUsed: '21000',
        effectiveGasPrice: '1000000000',
        status: 'success',
        logs: []
      }
    ];

    mockTransactionManager.getTransactionHistory.mockResolvedValueOnce(mockTransactions);
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Block 12345')).toBeInTheDocument();
      expect(screen.getByText('From: 0x123')).toBeInTheDocument();
      expect(screen.getByText('To: ' + mockAddress)).toBeInTheDocument();
    });
  });

  it('should display reverted status for failed transactions', async () => {
    const mockTransactions: TransactionReceipt[] = [
      {
        hash: '0x123',
        from: mockAddress,
        to: '0x456',
        blockNumber: 12345,
        gasUsed: '21000',
        effectiveGasPrice: '1000000000',
        status: 'reverted',
        logs: []
      }
    ];

    mockTransactionManager.getTransactionHistory.mockResolvedValueOnce(mockTransactions);
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sent')).toBeInTheDocument();
      expect(screen.getByText('Transaction reverted')).toBeInTheDocument();
    });
  });

  it('should display transaction logs when present', async () => {
    const mockTransactions: TransactionReceipt[] = [
      {
        hash: '0x123',
        from: mockAddress,
        to: '0x456',
        blockNumber: 12345,
        gasUsed: '21000',
        effectiveGasPrice: '1000000000',
        status: 'success',
        logs: [
          {
            topics: ['0xTransfer'],
            address: '0x789'
          }
        ]
      }
    ];

    mockTransactionManager.getTransactionHistory.mockResolvedValueOnce(mockTransactions);
    
    render(
      <TransactionHistory
        transactionManager={mockTransactionManager}
        address={mockAddress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Events:')).toBeInTheDocument();
      expect(screen.getByText('0xTransfer (0x789)')).toBeInTheDocument();
    });
  });
}); 