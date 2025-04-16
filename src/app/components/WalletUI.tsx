'use client';

import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { TransactionRequest } from '../../types/wallet';

export function WalletUI() {
  const { state, connect, disconnect, sendTransaction } = useWallet();
  const [txTo, setTxTo] = useState('');
  const [txValue, setTxValue] = useState('');

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSendTransaction = async () => {
    try {
      const tx: TransactionRequest = {
        from: state.address as `0x${string}`,
        to: txTo as `0x${string}`,
        value: txValue
      };
      const txHash = await sendTransaction(tx);
      console.log('Transaction sent:', txHash);
    } catch (error) {
      console.error('Failed to send transaction:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Wallet Status</h2>
        <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
        {state.address && <p>Address: {state.address}</p>}
        {state.balance && <p>Balance: {state.balance} ETH</p>}
      </div>

      <div className="space-y-4">
        {!state.isConnected ? (
          <button
            onClick={handleConnect}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Disconnect Wallet
            </button>

            <div className="space-y-2">
              <input
                type="text"
                value={txTo}
                onChange={(e) => setTxTo(e.target.value)}
                placeholder="Recipient Address"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={txValue}
                onChange={(e) => setTxValue(e.target.value)}
                placeholder="Amount in ETH"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleSendTransaction}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                Send Transaction
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 