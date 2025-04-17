import React, { useState } from 'react';
import { useDApp } from '../contexts/DAppContext';
import { useNetwork } from '../contexts/NetworkContext';
import { TokenManager } from '../core/token/TokenManager';
import { formatEther } from 'viem';

interface SendProps {
  onSend: (to: string, amount: string, tokenAddress?: string) => void;
  balance: string;
  tokens: Array<{
    address: string;
    symbol: string;
    balance: string;
  }>;
}

export const Send: React.FC<SendProps> = ({ onSend, balance, tokens }) => {
  const { currentAccount: address } = useDApp();
  const { network } = useNetwork();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('ETH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error('No wallet connected');
      }

      if (!to || !amount) {
        throw new Error('Please fill in all fields');
      }

      const token = tokens.find(t => t.symbol === selectedToken);
      await onSend(to, amount, token?.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Send {selectedToken}</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          To Address
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0x..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Amount
        </label>
        <div className="flex">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
          />
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-3 py-2 border-t border-r border-b rounded-r-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ETH">ETH</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Available Balance: {formatEther(BigInt(balance))} {selectedToken}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}; 