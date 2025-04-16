import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

interface TokenApproval {
  token: string;
  spender: string;
  amount: string;
  timestamp: number;
}

export const TokenApproval: React.FC = () => {
  const { selectedAddress } = useWallet();
  const { chainId, provider } = useNetwork();

  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAddress && provider) {
      loadApprovals();
    }
  }, [selectedAddress, chainId, provider]);

  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would fetch actual token approvals
      // For now, we'll use mock data
      const mockApprovals: TokenApproval[] = [
        {
          token: '0x1234...5678',
          spender: '0xabcd...efgh',
          amount: '1000000000000000000',
          timestamp: Date.now() - 86400000 // 1 day ago
        },
        {
          token: '0x9876...5432',
          spender: '0xijkl...mnop',
          amount: '500000000000000000',
          timestamp: Date.now() - 172800000 // 2 days ago
        }
      ];

      setApprovals(mockApprovals);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeApproval = async (token: string, spender: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would call the token contract to revoke approval
      // For now, we'll just remove it from the list
      setApprovals(prev => prev.filter(a => !(a.token === token && a.spender === spender)));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to revoke approval');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string): string => {
    try {
      return ethers.formatEther(amount);
    } catch {
      return amount;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!selectedAddress) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Token Approvals</h2>
        <p className="text-gray-500">Please connect your wallet to view token approvals.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Token Approvals</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No active token approvals found.</div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Token</h3>
                  <p className="text-sm font-mono">{approval.token}</p>
                  <div className="mt-2">
                    <h3 className="font-medium">Spender</h3>
                    <p className="text-sm font-mono">{approval.spender}</p>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium">Amount</h3>
                    <p className="text-sm">{formatAmount(approval.amount)} tokens</p>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Approved {formatTimeAgo(approval.timestamp)}
                  </div>
                </div>
                <button
                  onClick={() => revokeApproval(approval.token, approval.spender)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  disabled={isLoading}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 