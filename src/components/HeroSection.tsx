'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { formatEther } from 'viem';

export function HeroSection() {
  const { account, connect } = useWallet();
  const { networkName, symbol } = useNetwork();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center py-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/hex-grid.svg')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#6B3FA0]/10 to-black" />

      <div className="relative z-10 text-center">
        <motion.h1
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-[#00FF88] to-[#FFD700] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          FreoWallet
        </motion.h1>

        <motion.p
          className="text-xl text-white/80 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Your Gateway to Web3
        </motion.p>

        {account ? (
          <div className="space-y-6">
            <motion.div
              className="flex flex-col items-center space-y-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <span className="text-[#00FF88] text-lg">Connected to {networkName}</span>
              <span className="text-white/60">{account}</span>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <ActionButton icon="💰" label="Buy" onClick={() => {}} />
              <ActionButton icon="🔄" label="Swap" onClick={() => {}} />
              <ActionButton icon="🌉" label="Bridge" onClick={() => {}} />
              <ActionButton icon="💎" label="Earn" onClick={() => {}} />
            </div>
          </div>
        ) : (
          <motion.button
            onClick={connect}
            className="px-8 py-4 text-lg rounded-lg bg-gradient-to-r from-[#00FF88] to-[#FFD700] text-black font-semibold hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Connect Wallet
          </motion.button>
        )}
      </div>
    </section>
  );
}

function ActionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-lg bg-black/40 border border-[#00FF88]/20 hover:border-[#00FF88] transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-white/80">{label}</span>
    </motion.button>
  );
} 