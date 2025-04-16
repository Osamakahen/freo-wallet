import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useAddressBook } from '../contexts/AddressBookContext';

interface SendFormData {
  recipient: string;
  amount: string;
  token: string;
  gasPrice: string;
}

export const Send: React.FC = () => {
  const { address } = useWallet();
  const { sendTransaction } = useTransactions();
  const { chainId } = useNetwork();
  const { contacts } = useAddressBook();

  const [formData, setFormData] = useState<SendFormData>({
    recipient: '',
    amount: '',
    token: 'ETH',
    gasPrice: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.recipient || !ethers.isAddress(formData.recipient)) {
      setError('Invalid recipient address');
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Invalid amount');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const transaction = {
        to: formData.recipient,
        value: ethers.parseEther(formData.amount),
        chainId
      };

      const txHash = await sendTransaction(transaction);
      console.log('Transaction sent:', txHash);

      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        token: 'ETH',
        gasPrice: ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Send</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient</label>
          <input
            type="text"
            name="recipient"
            value={formData.recipient}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full p-2 border rounded"
            list="contacts"
          />
          <datalist id="contacts">
            {contacts.map(contact => (
              <option key={contact.id} value={contact.address}>
                {contact.name}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <div className="flex space-x-2">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.0"
              step="0.000000000000000001"
              min="0"
              className="flex-1 p-2 border rounded"
            />
            <select
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              className="p-2 border rounded"
            >
              <option value="ETH">ETH</option>
              {/* Add more tokens here */}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gas Price (Gwei)</label>
          <input
            type="number"
            name="gasPrice"
            value={formData.gasPrice}
            onChange={handleInputChange}
            placeholder="Auto"
            min="0"
            className="w-full p-2 border rounded"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading || !address}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}; 