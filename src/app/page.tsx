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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div
            initial={ANIMATIONS.fadeIn.initial}
            animate={ANIMATIONS.fadeIn.animate}
            transition={ANIMATIONS.spring}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00FF88] to-[#FFD700] bg-clip-text text-transparent">
              Welcome to Freo Wallet
            </h1>
            <p className="text-gray-400 mt-2">Your gateway to the decentralized web</p>
          </motion.div>
          
          <WalletModal
            isOpen={!isConnected}
            onClose={() => {}}
            onConnect={connect}
            onDisconnect={disconnect}
            detectedWallets={['MetaMask', 'FreoWallet']}
            theme={{
              primary: COLORS.primary,
              secondary: COLORS.secondary,
              background: COLORS.background.dark
            }}
            walletOptions={[
              { id: 'metamask', name: 'MetaMask', icon: '/wallets/metamask.svg' },
              { id: 'freo', name: 'FreoWallet', icon: '/wallets/freo.svg', isRecommended: true }
            ]}
            connectionStatus={
              isConnecting ? <PulseLoader color={COLORS.primary} size={8} /> : null
            }
          />
        </div>

        {!isConnected ? (
          <motion.div
            initial={ANIMATIONS.fadeIn.initial}
            animate={ANIMATIONS.fadeIn.animate}
            transition={ANIMATIONS.spring}
            className="text-center py-16"
          >
            <Lock className="mx-auto h-12 w-12 text-[#00FF88]" />
            <h3 className="mt-4 text-lg font-medium text-[#FFD700]">
              Unlock Your Web3 Vault
            </h3>
            <p className="mt-2 text-gray-400">
              Connect your wallet to view assets and transactions
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={ANIMATIONS.fadeIn.initial}
            animate={ANIMATIONS.fadeIn.animate}
            transition={ANIMATIONS.spring}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <motion.div
              className={`bg-[#0D0D0D] border border-[#00FF88]/20 rounded-xl p-6 shadow-[0_0_20px_rgba(0,255,136,0.1)]`}
              whileHover={{
                scale: 1.02,
                boxShadow: SHADOWS.hover
              }}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#00FF88]">Your Tokens</h2>
              <TokenList 
                tokens={tokens}
                onTokenClick={(token) => console.log('Token clicked:', token)}
                displayOptions={{
                  showFiatValue: true,
                  showChainIndicator: true
                }}
                style={{
                  headerColor: COLORS.primary,
                  hoverEffect: 'glow'
                }}
              />
            </motion.div>
            
            <motion.div
              className={`bg-[#0D0D0D] border border-[#00FF88]/20 rounded-xl p-6 shadow-[0_0_20px_rgba(0,255,136,0.1)]`}
              whileHover={{
                scale: 1.02,
                boxShadow: SHADOWS.hover
              }}
            >
              <h2 className="text-xl font-semibold mb-4 text-[#00FF88]">Recent Transactions</h2>
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