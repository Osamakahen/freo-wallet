import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../contexts/NetworkContext';
import { useWallet } from '../../contexts/WalletContext';
import { useTransactions } from '../../contexts/TransactionContext';
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
  const { account } = useWallet();
  const { transactionHistory, loading, error, refreshHistory } = useTransactions();

  useEffect(() => {
    if (account && chainId) {
      refreshHistory();
    }
  }, [account, chainId, refreshHistory]);

  if (loading) {
    return <div className="text-blue-500">Loading transaction history...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!account) {
    return <div className="text-gray-500">Please connect your wallet to view transaction history</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Transaction History</h2>
      
      {transactionHistory.length === 0 ? (
        <p className="text-gray-500">No transactions found</p>
      ) : (
        <div className="space-y-4">
          {transactionHistory.map((tx) => (
            <div
              key={tx.hash}
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {tx.to === account ? 'Received' : 'Sent'} {formatEther(tx.value)} ETH
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