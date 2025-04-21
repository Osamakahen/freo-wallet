import React, { useState } from 'react';
import { TokenMetadata } from '../../types/wallet';

interface SendTokenProps {
  onSend: (to: `0x${string}`, amount: string, tokenAddress?: `0x${string}`) => void;
  balance: string;
  tokens: TokenMetadata[];
}

export const SendToken: React.FC<SendTokenProps> = ({ onSend, balance, tokens }) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<string>('ETH');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!to || !amount) {
      setError('Please fill in all fields');
      return;
    }

    if (!to.startsWith('0x') || to.length !== 42) {
      setError('Invalid recipient address');
      return;
    }

    const token = tokens.find(t => t.symbol === selectedToken);
    onSend(to as `0x${string}`, amount, token?.address);
  };

  return (
    <div className="border rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Send Token</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ETH">ETH</option>
            {tokens.map((token) => (
              <option key={token.address} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0.0"
            step="any"
          />
          <p className="text-sm text-gray-500 mt-1">
            Balance: {selectedToken === 'ETH' ? balance : tokens.find(t => t.symbol === selectedToken)?.balance || '0'}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}; 