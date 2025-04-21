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
    <main className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* Hero Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold mb-6"
              style={{ color: COLORS.textPrimary }}
            >
              Your Gateway to Web3
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl mb-8"
              style={{ color: COLORS.textSecondary }}
            >
              Secure, simple, and powerful wallet for managing your digital assets
            </motion.p>
          </div>

          {/* Wallet Connection Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                Freo Wallet
              </h2>
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
                  className="px-6 py-3 rounded-lg text-sm font-medium"
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
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>Secure Storage</h3>
              <p style={{ color: COLORS.textSecondary }}>Your private keys are encrypted and stored securely on your device.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>Easy Transactions</h3>
              <p style={{ color: COLORS.textSecondary }}>Send and receive tokens with just a few clicks.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>Token Management</h3>
              <p style={{ color: COLORS.textSecondary }}>View and manage all your tokens in one place.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        detectedWallets={detectedWallets}
      />
    </main>
  );
} 