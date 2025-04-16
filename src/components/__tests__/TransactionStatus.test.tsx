import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionStatus } from '../TransactionStatus';
import { WebSocketTransactionMonitor } from '../../core/transaction/WebSocketTransactionMonitor';

// Mock the WebSocketTransactionMonitor
jest.mock('../../core/transaction/WebSocketTransactionMonitor', () => {
  return {
    WebSocketTransactionMonitor: jest.fn().mockImplementation(() => ({
      getTransactionStatus: jest.fn(),
      getTransactionReceipt: jest.fn(),
      monitorTransaction: jest.fn(),
      stopMonitoring: jest.fn()
    }))
  };
});

describe('TransactionStatus', () => {
  const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockTransactionManager = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    render(
      <TransactionStatus
        txHash={mockTxHash as `0x${string}`}
        transactionManager={mockTransactionManager}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays error message when status loading fails', async () => {
    const mockMonitor = new WebSocketTransactionMonitor();
    (mockMonitor.getTransactionStatus as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(
      <TransactionStatus
        txHash={mockTxHash as `0x${string}`}
        transactionManager={mockTransactionManager}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load transaction status')).toBeInTheDocument();
    });
  });

  it('displays transaction details when status is success', async () => {
    const mockMonitor = new WebSocketTransactionMonitor();
    const mockReceipt = {
      status: 'success',
      blockNumber: 123456,
      gasUsed: 21000,
      effectiveGasPrice: '1000000000',
      logs: []
    };

    (mockMonitor.getTransactionStatus as jest.Mock).mockResolvedValue('success');
    (mockMonitor.getTransactionReceipt as jest.Mock).mockResolvedValue(mockReceipt);

    render(
      <TransactionStatus
        txHash={mockTxHash as `0x${string}`}
        transactionManager={mockTransactionManager}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(screen.getByText('21000')).toBeInTheDocument();
      expect(screen.getByText('0.000000001 ETH')).toBeInTheDocument();
    });
  });

  it('displays transaction logs when available', async () => {
    const mockMonitor = new WebSocketTransactionMonitor();
    const mockReceipt = {
      status: 'success',
      blockNumber: 123456,
      gasUsed: 21000,
      effectiveGasPrice: '1000000000',
      logs: [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          topics: ['0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef']
        }
      ]
    };

    (mockMonitor.getTransactionStatus as jest.Mock).mockResolvedValue('success');
    (mockMonitor.getTransactionReceipt as jest.Mock).mockResolvedValue(mockReceipt);

    render(
      <TransactionStatus
        txHash={mockTxHash as `0x${string}`}
        transactionManager={mockTransactionManager}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Contract: 0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    });
  });

  it('cleans up WebSocket connection on unmount', () => {
    const mockMonitor = new WebSocketTransactionMonitor();
    const { unmount } = render(
      <TransactionStatus
        txHash={mockTxHash as `0x${string}`}
        transactionManager={mockTransactionManager}
      />
    );

    unmount();

    expect(mockMonitor.stopMonitoring).toHaveBeenCalledWith(mockTxHash);
  });
}); 