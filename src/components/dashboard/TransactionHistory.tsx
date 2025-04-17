import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { useWallet } from '../../contexts/WalletContext';
import { formatEther } from 'ethers';
import { toast } from 'react-toastify';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export const TransactionHistory: React.FC = () => {
  const { chainId } = useNetwork();
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address || !chainId) return;

      try {
        setLoading(true);
        setError(null);

        // Here you would typically fetch transactions from your backend or blockchain
        // For now, we'll just use a mock response
        const mockTransactions: Transaction[] = [
          {
            hash: '0x123...abc',
            from: address,
            to: '0x456...def',
            value: '1000000000000000000', // 1 ETH
            timestamp: Date.now() - 3600000, // 1 hour ago
            status: 'confirmed'
          },
          {
            hash: '0x789...ghi',
            from: address,
            to: '0x012...jkl',
            value: '500000000000000000', // 0.5 ETH
            timestamp: Date.now() - 7200000, // 2 hours ago
            status: 'pending'
          }
        ];

        setTransactions(mockTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        toast.error('Failed to fetch transaction history', {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address, chainId]);

  if (loading) {
    return <div className="text-blue-500">Loading transaction history...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!address) {
    return <div className="text-gray-500">Please connect your wallet to view transaction history</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction History</h2>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {tx.to === address ? 'Received' : 'Sent'} {formatEther(tx.value)} ETH
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : tx.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 break-all">
                  Hash: {tx.hash}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 