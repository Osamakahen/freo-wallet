'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletModal } from '@/components/wallet/WalletModal';
import { TokenList } from '@/components/TokenList';
import TransactionHistory from '@/components/TransactionHistory';
import { useWallet } from '@/contexts/WalletContext';
import { useToken } from '@/contexts/TokenContext';
import { formatEther } from 'ethers';
import { COLORS } from '@/constants/colors';
import { WalletProvider } from '@/contexts/WalletContext';
import { TokenProvider } from '@/contexts/TokenContext';

const mainnetConfig = {
  chainId: 1,
  name: 'Ethereum',
  symbol: 'ETH',
  rpcUrl: 'https://mainnet.infura.io/v3/your-api-key'
};

export default function Home() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const { tokens } = useToken();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Welcome to Freo Wallet</h1>
          <p className="text-gray-400 mt-2">Your gateway to the decentralized web</p>
        </motion.div>
        
        <WalletModal
          isOpen={!isConnected}
          onClose={() => {}}
          onConnect={connect}
          onDisconnect={disconnect}
          detectedWallets={['MetaMask']}
        />
      </div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-[#1E1E1E] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Your Tokens</h2>
            <TokenList tokens={tokens} />
          </div>
          
          <div className="bg-[#1E1E1E] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <TransactionHistory 
              address={address || '0x'}
              network={mainnetConfig}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
} 