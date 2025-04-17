import React, { useState, useEffect } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { useWallet } from '../contexts/WalletContext';
import { useGas } from '../contexts/GasContext';
import { toast } from 'react-toastify';

interface TokenApprovalProps {
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amount: string;
  onApproval: (approved: boolean) => void;
}

export const TokenApproval: React.FC<TokenApprovalProps> = ({
  tokenAddress,
  spenderAddress,
  amount,
  onApproval
}) => {
  const { chainId } = useNetwork();
  const { address } = useWallet();
  const { gasPrices, updateGasSettings } = useGas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const checkApproval = async () => {
      if (!address || !chainId) return;

      try {
        setLoading(true);
        setError(null);

        // Here you would typically call your token contract's allowance method
        // For example:
        // const allowance = await tokenContract.allowance(address, spenderAddress);
        // setApproved(allowance.gte(amount));

        // For now, we'll just set it to false
        setApproved(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check approval');
        toast.error('Failed to check token approval', {
          position: 'top-right',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    checkApproval();
  }, [address, chainId, tokenAddress, spenderAddress, amount]);

  const handleApprove = async () => {
    if (!address || !chainId) {
      toast.error('Please connect your wallet first', {
        position: 'top-right',
        autoClose: 5000,
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Here you would typically call your token contract's approve method
      // For example:
      // const tx = await tokenContract.approve(spenderAddress, amount);
      // await tx.wait();
      // setApproved(true);
      // onApproval(true);

      // For now, we'll just simulate a successful approval
      setApproved(true);
      onApproval(true);
      toast.success('Token approval successful', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve token');
      toast.error('Failed to approve token', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-blue-500">Checking approval status...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Token Approval</h3>
        <p className="text-sm text-gray-500">
          Current Status: {approved ? 'Approved' : 'Not Approved'}
        </p>
      </div>

      {!approved && (
        <button
          onClick={handleApprove}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Approve Token
        </button>
      )}
    </div>
  );
}; 