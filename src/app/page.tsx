'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletModal } from '@/components/wallet/WalletModal';
import { Tooltip } from '@/components/ui/tooltip';
import { TokenList } from '@/components/wallet/TokenList';
import { SendToken } from '@/components/wallet/SendToken';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { useWallet } from '@/contexts/WalletContext';
import { COLORS } from '@/constants/colors';
import { type TokenMetadata } from '@/types/token';
import { type ChainConfig } from '@/types/network';
import { formatEther } from 'ethers';

export default function Home() {
  const { address, balance, chainId, connect, disconnect, isConnected } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [currentChain, setCurrentChain] = useState<ChainConfig | null>(null);

  useEffect(() => {
    const checkWallets = () => {
      const wallets = [];
      if (window.ethereum) {
        wallets.push('MetaMask');
      }
      setDetectedWallets(wallets);
    };

    checkWallets();
  }, []);

  const handleConnect = () => {
    setIsModalOpen(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formattedBalance = balance ? formatEther(balance) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Freo Wallet</h1>
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <Tooltip content={`Balance: ${formattedBalance} ETH`}>
                <span className="text-white">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </Tooltip>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Features</h2>
            <ul className="space-y-2">
              <li className="text-gray-300">Secure wallet connection</li>
              <li className="text-gray-300">Balance display</li>
              <li className="text-gray-300">Transaction history</li>
              <li className="text-gray-300">Token management</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Network Info</h2>
            {currentChain && (
              <div className="space-y-2">
                <p className="text-gray-300">Network: {currentChain.name}</p>
                <p className="text-gray-300">Chain ID: {currentChain.chainId}</p>
                <p className="text-gray-300">Symbol: {currentChain.symbol}</p>
              </div>
            )}
          </div>
        </section>

        {isConnected && (
          <section className="mt-8">
            <TokenList tokens={tokens} />
          </section>
        )}
      </main>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        detectedWallets={detectedWallets}
      />
    </div>
  );
} 