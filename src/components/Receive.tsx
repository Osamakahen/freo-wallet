import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';

export const Receive: React.FC = () => {
  const { account } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  if (!account) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Receive</h2>
        <p className="text-gray-500">Please connect your wallet to view your receiving address.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Receive</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <QRCodeSVG
            value={account}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        <div className="w-full max-w-md bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-sm text-gray-500 mb-1">Your Address</p>
              <p className="font-mono text-sm break-all">{account}</p>
            </div>
            <button
              onClick={handleCopy}
              className="ml-2 p-2 text-blue-500 hover:text-blue-600"
              title="Copy address"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="w-full max-w-md">
          <p className="text-sm text-gray-500 text-center">
            Send only Ethereum and ERC-20 tokens to this address. Sending other types of tokens may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}; 