import React, { useState, useEffect } from 'react';
import { TransactionReceipt } from '../types/wallet';
import { WebSocketTransactionMonitor } from '../core/transaction/WebSocketTransactionMonitor';

interface TransactionManager {
  getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
}

interface TransactionStatusProps {
  txHash: `0x${string}`;
  transactionManager: TransactionManager;
  onComplete?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ 
  txHash, 
  transactionManager,
  onComplete 
}) => {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transactionMonitor = new WebSocketTransactionMonitor();
    const loadTransactionStatus = async () => {
      try {
        const currentReceipt = await transactionManager.getTransactionReceipt(txHash);
        if (currentReceipt) {
          setReceipt(currentReceipt);
          setStatus(currentReceipt.status === 'success' ? 'confirmed' : 'failed');
          if (onComplete) {
            onComplete();
          }
        } else {
          // Start monitoring if transaction is still pending
          const unsubscribe = transactionMonitor.subscribe(txHash, (newStatus) => {
            setStatus(newStatus);
            if (newStatus !== 'pending') {
              transactionManager.getTransactionReceipt(txHash).then((receipt) => {
                if (receipt) {
                  setReceipt(receipt);
                  if (onComplete) {
                    onComplete();
                  }
                }
              });
            }
          });

          return () => unsubscribe();
        }
      } catch (err) {
        setError('Failed to load transaction status');
      }
    };

    loadTransactionStatus();
  }, [txHash, transactionManager, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction Status</h3>
        <span className={`font-medium ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {receipt && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Block Number</p>
              <p className="font-medium">{receipt.blockNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gas Used</p>
              <p className="font-medium">{receipt.gasUsed}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Effective Gas Price</p>
            <p className="font-medium">{receipt.effectiveGasPrice} Gwei</p>
          </div>

          {receipt.logs.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Event Logs</p>
              <div className="space-y-2">
                {receipt.logs.map((log, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <p className="text-xs break-all">
                      <span className="font-medium">Address:</span> {log.address}
                    </p>
                    <p className="text-xs break-all">
                      <span className="font-medium">Topics:</span> {log.topics.join(', ')}
                    </p>
                    <p className="text-xs break-all">
                      <span className="font-medium">Data:</span> {log.data}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 