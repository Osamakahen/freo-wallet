'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { SessionService } from '@/services/SessionService';
import { DAppSession } from '@/services/SessionService';
import { Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

export const AssetDashboard: React.FC = () => {
  const { account, chainId } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;
      
      setIsLoading(true);
      try {
        // Fetch balance and transactions
        // This is a placeholder - implement actual data fetching
        setBalance('1.234');
        setRecentTransactions([
          { type: 'send', amount: '0.1', timestamp: Date.now() - 3600000 },
          { type: 'receive', amount: '0.5', timestamp: Date.now() - 7200000 }
        ]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [account, chainId]);

  if (!account) {
    return null;
  }

  return (
    <motion.div 
      className="p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-[#00FF88]/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Assets</h2>
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#00FF88]" />
          <span className="text-white/80">{account.slice(0, 6)}...{account.slice(-4)}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#00FF88] animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="text-3xl font-bold text-white mb-1">{balance} ETH</div>
            <div className="text-sm text-white/60">Current Balance</div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentTransactions.map((tx, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-black/30 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tx.type === 'receive' ? 'bg-[#00FF88]/10' : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'receive' ? (
                        <ArrowDownRight className="w-5 h-5 text-[#00FF88]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {tx.type === 'receive' ? 'Received' : 'Sent'} {tx.amount} ETH
                      </div>
                      <div className="text-sm text-white/60">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    tx.type === 'receive' ? 'text-[#00FF88]' : 'text-red-500'
                  }`}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} ETH
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}; 