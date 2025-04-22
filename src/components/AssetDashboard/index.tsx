'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useToken } from '@/contexts/TokenContext';

export function AssetDashboard() {
  const { balance } = useWallet();
  const { tokens } = useToken();

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center text-[#00FF88] mb-16 font-satoshi"
        >
          Your Assets
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-xl border border-[#FFD700] p-8 rounded-xl"
          >
            <h3 className="text-xl font-bold text-[#00FF88] mb-4">Portfolio Value</h3>
            <p className="text-3xl font-bold text-white">{balance} ETH</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/60 backdrop-blur-xl border border-[#FFD700] p-8 rounded-xl"
          >
            <h3 className="text-xl font-bold text-[#00FF88] mb-4">Tokens</h3>
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.address} className="flex justify-between items-center">
                  <span className="text-white">{token.symbol}</span>
                  <span className="text-white">{token.balance}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 