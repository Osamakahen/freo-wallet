import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { TransactionReceipt } from 'viem';

interface TransactionHistoryProps {
  address: `0x${string}`;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address }) => {
  const { network } = useNetwork();
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadTransactions();
    }
  }, [address]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data
      const mockTransactions: TransactionReceipt[] = [
        {
          transactionHash: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          blockNumber: BigInt(12345678),
          from: address,
          to: '0xabcdef1234567890123456789012345678901234' as `0x${string}`,
          status: 'success',
          gasUsed: BigInt(21000),
          effectiveGasPrice: BigInt(20000000000),
          logs: [],
          blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          contractAddress: null,
          cumulativeGasUsed: BigInt(21000),
          logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          transactionIndex: 0,
          type: '0x0' as `0x${string}`
        },
        {
          transactionHash: '0x9876543210987654321098765432109876543210' as `0x${string}`,
          blockNumber: BigInt(12345677),
          from: address,
          to: '0xijklmnopqrstuvwxyz0123456789abcdef1234' as `0x${string}`,
          status: 'success',
          gasUsed: BigInt(42000),
          effectiveGasPrice: BigInt(20000000000),
          logs: [],
          blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          contractAddress: null,
          cumulativeGasUsed: BigInt(42000),
          logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          transactionIndex: 0,
          type: '0x0' as `0x${string}`
        }
      ];

      setTransactions(mockTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (blockNumber: bigint): string => {
    // In a real implementation, this would calculate the time difference
    // For now, we'll just return a mock value
    return '2 hours ago';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Network: {network.networkName} (Chain ID: {network.chainId})
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No transactions found.</div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Transaction Hash</h3>
                  <p className="text-sm font-mono">{tx.transactionHash}</p>
                  <div className="mt-2">
                    <h3 className="font-medium">To</h3>
                    <p className="text-sm font-mono">{tx.to}</p>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium">Status</h3>
                    <p className="text-sm">{tx.status}</p>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {formatTimeAgo(tx.blockNumber)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 