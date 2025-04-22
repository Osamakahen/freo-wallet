'use client';

import { motion } from 'framer-motion';
import { Database, Shield, Lock } from 'lucide-react';

const dapps = [
  { name: 'Uniswap', icon: Database, description: 'Decentralized Exchange' },
  { name: 'Aave', icon: Shield, description: 'Lending Protocol' },
  { name: 'OpenSea', icon: Lock, description: 'NFT Marketplace' }
];

export function DAppShowcase() {
  return (
    <section className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center text-[#00FF88] mb-16 font-satoshi"
        >
          Popular dApps
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {dapps.map((dapp, index) => (
            <motion.div
              key={dapp.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/60 backdrop-blur-xl border border-[#FFD700] p-8 rounded-xl"
            >
              <dapp.icon className="w-12 h-12 mb-4 text-[#00FF88]" />
              <h3 className="text-xl font-bold text-[#00FF88] mb-2">{dapp.name}</h3>
              <p className="text-white/80">{dapp.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 