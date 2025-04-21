import React from 'react';
import { type ChainConfig } from '@/types/network';

interface TransactionHistoryProps {
  address: string;
  network: ChainConfig;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address, network }) => {
  return (
    <div className="border rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Address: {address}</p>
        <p className="text-sm text-gray-500">Network: {network.name}</p>
      </div>
    </div>
  );
}; 