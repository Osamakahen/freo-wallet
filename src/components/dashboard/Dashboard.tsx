import React, { useState } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { Portfolio } from './Portfolio';
import { DAppConnections } from './DAppConnections';
import { TransactionHistory } from './TransactionHistory';
import { TokenManager } from '../../core/token/TokenManager';
import { TransactionManager } from '../../core/transaction/TransactionManager';

interface DashboardProps {
  tokenManager: TokenManager;
  transactionManager: TransactionManager;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tokenManager,
  transactionManager,
}) => {
  const { currentAccount } = useDApp();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'dapps' | 'transactions'>('portfolio');

  if (!currentAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-500">Please connect your wallet to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'portfolio'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('dapps')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'dapps'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              dApps
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'transactions'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transactions
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {activeTab === 'portfolio' && <Portfolio tokenManager={tokenManager} />}
          {activeTab === 'dapps' && <DAppConnections />}
          {activeTab === 'transactions' && (
            <TransactionHistory address={currentAccount} />
          )}
        </div>
      </div>
    </div>
  );
}; 