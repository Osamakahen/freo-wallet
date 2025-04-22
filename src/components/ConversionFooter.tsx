'use client';

import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';

export function ConversionFooter() {
  const { connect } = useWallet();

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-[#00FF88] mb-8 font-satoshi"
        >
          Ready to Get Started?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/80 mb-12"
        >
          Connect your wallet and start exploring the decentralized web
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={connect}
          className="bg-[#00FF88] text-black font-bold py-4 px-8 rounded-xl hover:bg-opacity-90 transition-colors"
        >
          Connect Wallet
        </motion.button>
      </div>
    </section>
  );
} 