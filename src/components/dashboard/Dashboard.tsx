import React, { useState } from 'react';
import { Portfolio } from './Portfolio';
import { DAppConnections } from '../DAppConnections';
import TransactionHistory from '../TransactionHistory';
import { TokenManager } from '../../core/token/TokenManager';
import { useWallet } from '../../hooks/useWallet';
import { type Address } from 'viem';

interface DashboardProps {
  tokenManager: TokenManager;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tokenManager,
}) => {
  const { state } = useWallet();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'dapps' | 'transactions'>('portfolio');

  if (!state.address) {
    return <div>Please connect your wallet</div>;
  }

  const networkConfig = {
    chainId: state.chainId,
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    symbol: 'ETH'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 rounded ${
                activeTab === 'portfolio' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('dapps')}
              className={`px-4 py-2 rounded ${
                activeTab === 'dapps' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              DApps
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded ${
                activeTab === 'transactions' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Transactions
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {activeTab === 'portfolio' && <Portfolio tokenManager={tokenManager} />}
          {activeTab === 'dapps' && <DAppConnections address={state.address} />}
          {activeTab === 'transactions' && (
            <TransactionHistory address={state.address} network={networkConfig} />
          )}
        </div>
      </div>
    </div>
  );
}; 