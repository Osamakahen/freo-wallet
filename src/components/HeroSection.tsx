'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import { BalanceDisplay } from './BalanceDisplay';
import { ActionButton } from './ActionButton';

export const HeroSection = () => {
  const { address, isConnected, balance } = useWallet();

  return (
    <header className="relative h-[110vh] overflow-hidden cyberpunk-bg">
      {/* Animated background */}
      <BlockchainVisualizer nodes={150} color="#00FF88" speed={0.5} />
      
      {/* Main card */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div 
          className="w-[380px] cyberpunk-panel cyberpunk-border cyberpunk-glow"
          whileHover={{ scale: 1.03 }}
        >
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-4xl font-bold cyberpunk-text">
              FreoWallet
            </h1>
            <NetworkStatusBadge chain="multi" />
          </div>
          
          <BalanceDisplay 
            value={balance} 
            cryptoEquivalent={`${balance} ETH`} 
            trend="up" 
          />
          
          <div className="mt-8 grid grid-cols-4 gap-4">
            <ActionButton icon="💸" label="Buy" glow="green" />
            <ActionButton icon="🔄" label="Swap" glow="gold" />
            <ActionButton icon="🌉" label="Bridge" glow="green" />
            <ActionButton icon="🏛️" label="Earn" glow="gold" />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <ChevronDown className="h-8 w-8 text-[#00FF88] animate-bounce" />
      </div>
    </header>
  );
}; 