import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { TransactionManager } from '../../core/transaction/TransactionManager';
import { TransactionReceipt } from '../../types/wallet';
import { formatEther } from 'ethers/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  transactionManager: TransactionManager;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactionManager,
}) => {
  const { currentAccount, currentChain } = useDApp();
  const [transactions, setTransactions] = useState<TransactionReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'success' | 'reverted'>('all');

  useEffect(() => {
    const loadTransactions = async () => {
      if (!currentAccount) return;

      try {
        setLoading(true);
        setError(null);

        const history = await transactionManager.getTransactionHistory(currentAccount);
        setTransactions(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [currentAccount, currentChain, transactionManager]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Transaction History</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'success' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('reverted')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'reverted' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Reverted
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tx.type || 'Transfer'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatEther(tx.value || '0')} ETH
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(tx.timestamp * 1000, { addSuffix: true })}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 