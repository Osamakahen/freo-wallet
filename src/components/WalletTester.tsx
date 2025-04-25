'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useToken } from '@/contexts/TokenContext';
import { formatEther, parseEther } from 'ethers';

export const WalletTester = () => {
  const { account, balance, connected } = useWallet();
  const { tokens, addToken } = useToken();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!recipientAddress || !amount || !account) {
        throw new Error('Please fill in all fields');
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('No wallet found');
      }

      const tx = {
        from: account,
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount).toString(),
        data: '0x'
      };

      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx]
      });
      
      console.log('Transaction sent:', hash);
      alert(`Transaction sent! Hash: ${hash}`);
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tokenAddress) {
        throw new Error('Please enter a token address');
      }

      // Add the token to the list
      addToken({
        address: tokenAddress as `0x${string}`,
        symbol: 'UNKNOWN', // This will be updated when token info is fetched
        name: 'Unknown Token',
        decimals: 18,
        balance: '0',
        chainId: 1
      });

      alert('Token added successfully!');
    } catch (err) {
      console.error('Add token error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="bg-[#6B3FA0]/30 backdrop-blur-md border border-[#A2E4B8] rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-[#A2E4B8]">Wallet Tester</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-white mb-2">Your Address: {account}</p>
          <p className="text-white mb-4">Balance: {balance} ETH</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-[#A2E4B8]">Send ETH</h3>
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full p-2 rounded bg-[#6B3FA0]/50 border border-[#A2E4B8] text-white placeholder-[#A2E4B8]/50"
          />
          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 rounded bg-[#6B3FA0]/50 border border-[#A2E4B8] text-white placeholder-[#A2E4B8]/50"
          />
          <button
            onClick={handleSendTransaction}
            disabled={loading}
            className="w-full p-2 rounded bg-[#A2E4B8] text-[#6B3FA0] font-medium hover:bg-[#A2E4B8]/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send ETH'}
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-[#A2E4B8]">Add Token</h3>
          <input
            type="text"
            placeholder="Token Address"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full p-2 rounded bg-[#6B3FA0]/50 border border-[#A2E4B8] text-white placeholder-[#A2E4B8]/50"
          />
          <button
            onClick={handleAddToken}
            disabled={loading}
            className="w-full p-2 rounded bg-[#A2E4B8] text-[#6B3FA0] font-medium hover:bg-[#A2E4B8]/90 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Token'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-500/20 border border-red-500 text-white">
            {error}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-medium text-[#A2E4B8] mb-2">Your Tokens</h3>
          <div className="space-y-2">
            {tokens.map((token, index) => (
              <div
                key={index}
                className="p-2 rounded bg-[#6B3FA0]/50 border border-[#A2E4B8] text-white"
              >
                <p>Address: {token.address}</p>
                <p>Symbol: {token.symbol}</p>
                <p>Balance: {token.balance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 