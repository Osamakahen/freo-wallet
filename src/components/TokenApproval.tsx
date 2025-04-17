import React, { useState } from 'react';
import { useDApp } from '../contexts/DAppContext';
import { useNetwork } from '../contexts/NetworkContext';
import { formatEther } from 'viem';

interface TokenApprovalProps {
  tokenAddress: string;
  spenderAddress: string;
  amount: string;
  onApprove: (tokenAddress: string, spenderAddress: string, amount: string) => Promise<void>;
}

export const TokenApproval: React.FC<TokenApprovalProps> = ({
  tokenAddress,
  spenderAddress,
  amount,
  onApprove
}) => {
  const { currentAccount } = useDApp();
  const { network } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      await onApprove(tokenAddress, spenderAddress, amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Token Approval</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Network: {network.networkName} (Chain ID: {network.chainId})
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Token Address: {tokenAddress}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Spender Address: {spenderAddress}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Amount: {formatEther(BigInt(amount))}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleApprove}
        disabled={loading || !currentAccount}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Approving...' : 'Approve Token'}
      </button>
    </div>
  );
}; 