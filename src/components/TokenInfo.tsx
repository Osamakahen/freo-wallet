import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TokenManager } from '../core/token/TokenManager';
import { TokenBalance } from '../types/token';
import { WalletAdapter } from '../core/evm/WalletAdapter';
import { mainnet } from 'viem/chains';

interface TokenInfoProps {
  tokenAddress: `0x${string}`;
  userAddress: `0x${string}`;
  spenderAddress?: `0x${string}`;
}

export const TokenInfo: React.FC<TokenInfoProps> = ({
  tokenAddress,
  userAddress,
  spenderAddress
}) => {
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalAmount, setApprovalAmount] = useState<string>('');

  const tokenManager = useMemo(() => new TokenManager(new WalletAdapter(mainnet)), []);

  const loadTokenInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const balance = await tokenManager.getTokenBalance(tokenAddress, userAddress);
      setTokenBalance(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load token info');
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, userAddress, tokenManager]);

  useEffect(() => {
    loadTokenInfo();
  }, [loadTokenInfo]);

  const handleApprove = async () => {
    if (!spenderAddress || !approvalAmount) return;

    try {
      setIsLoading(true);
      const txHash = await tokenManager.approveToken(
        tokenAddress,
        spenderAddress,
        approvalAmount
      );
      await loadTokenInfo(); // Refresh data after approval
      return txHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve token');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading token information...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!tokenBalance) {
    return <div className="p-4">No token information available</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Token</h3>
        <p className="text-sm text-gray-500">{tokenBalance.tokenAddress}</p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">Balance</p>
        <p className="text-xl font-bold">
          {tokenBalance.balance}
        </p>
      </div>

      {spenderAddress && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Approval</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={approvalAmount}
              onChange={(e) => setApprovalAmount(e.target.value)}
              placeholder="Amount to approve"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleApprove}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 