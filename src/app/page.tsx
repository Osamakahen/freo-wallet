'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { Tooltip } from '@/components/ui/tooltip';
import { WalletModal } from '@/components/wallet/WalletModal';
import { formatEther } from 'viem';
import { COLORS } from '@/constants/colors';

export default function Home() {
  const { state, connect, disconnect, isConnecting } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);

  useEffect(() => {
    const checkWallets = () => {
      const wallets = [];
      if (window.ethereum?.isMetaMask) wallets.push('MetaMask');
      // Add more wallet checks as needed
      setDetectedWallets(wallets);
    };

    checkWallets();
  }, []);

  const handleConnect = async () => {
    if (detectedWallets.length > 0) {
      setIsModalOpen(true);
    } else {
      await connect();
    }
  };

  const formatBalance = (balance: string) => {
    try {
      return parseFloat(formatEther(BigInt(balance))).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
            Freo Wallet
          </h1>
          {state.isConnected ? (
            <div className="flex items-center gap-4">
              <Tooltip content={`Balance: ${formatBalance(state.balance)} ETH`}>
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {state.address?.slice(0, 6)}...{state.address?.slice(-4)}
                </span>
              </Tooltip>
              <motion.button
                onClick={disconnect}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: COLORS.error,
                  color: 'white',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Disconnect
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: isConnecting ? COLORS.secondary : COLORS.primary,
                color: 'white',
                opacity: isConnecting ? 0.7 : 1,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          )}
        </div>

        <WalletModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          detectedWallets={detectedWallets}
        />
      </div>
    </main>
  );
} 