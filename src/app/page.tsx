'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletModal } from '@/components/wallet/WalletModal';
import { TokenList } from '@/components/TokenList';
import TransactionHistory from '@/components/TransactionHistory';
import { useWallet } from '@/contexts/WalletContext';
import { useToken } from '@/contexts/TokenContext';
import { formatEther } from 'ethers';
import { COLORS, SHADOWS, ANIMATIONS } from '@/constants/design';
import { CHAINS } from '@/constants/chains';
import { Lock } from 'lucide-react';
import { PulseLoader } from 'react-spinners';

export default function Home() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const { tokens } = useToken();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  return (
    <div className="min-h-screen bg-[#6B3FA0] text-white"
      style={{
        backgroundImage: "url('/geometric-pattern.svg')",
        backgroundBlendMode: "overlay",
        backgroundSize: "cover"
      }}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-[#A2E4B8] bg-clip-text text-transparent">
              FreoWallet
            </h1>
            <p className="text-[#A2E4B8] mt-2 text-xl">
              Your Trusted and Easy-going WEB3 Mate
            </p>
          </motion.div>
          
          <WalletModal
            isOpen={!isConnected}
            onClose={() => {}}
            onConnect={connect}
            onDisconnect={disconnect}
            detectedWallets={[]}
            isDevMode={isDevMode}
          />
        </div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-16"
          >
            <Lock className="mx-auto h-12 w-12 text-[#A2E4B8]" />
            <h3 className="mt-4 text-lg font-medium text-white">
              Unlock Your Web3 Vault
            </h3>
            <p className="mt-2 text-[#A2E4B8]">
              Connect your wallet to view assets and transactions
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <motion.div
              className="bg-[#6B3FA0]/50 backdrop-blur-sm border border-[#A2E4B8] rounded-xl p-6 shadow-lg"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#A2E4B8]">Your Tokens</h2>
              <TokenList 
                tokens={tokens}
                onTokenClick={(token) => console.log('Token clicked:', token)}
                displayOptions={{
                  showFiatValue: true,
                  showChainIndicator: true
                }}
              />
            </motion.div>
            
            <motion.div
              className="bg-[#6B3FA0]/50 backdrop-blur-sm border border-[#A2E4B8] rounded-xl p-6 shadow-lg"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#A2E4B8]">Recent Transactions</h2>
              <TransactionHistory 
                address={address || '0x'}
                network={{
                  chainId: CHAINS.ethereum.id,
                  name: CHAINS.ethereum.name,
                  rpcUrl: process.env.NEXT_PUBLIC_INFURA_URL || '',
                  symbol: CHAINS.ethereum.nativeCurrency.symbol
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 