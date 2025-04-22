'use client';

import { motion } from 'framer-motion';
import { Database, Network, Shield, Lock, ArrowRightLeft, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Auto-Connect',
    description: '1-click access to 200+ dApps',
    color: '#00FF88'
  },
  {
    icon: Network,
    title: 'Omni-Chain',
    description: 'Seamless cross-chain transactions',
    color: '#00FF88'
  },
  {
    icon: Shield,
    title: 'Security',
    description: '98% Security Score',
    color: '#00FF88'
  },
  {
    icon: Lock,
    title: 'Privacy',
    description: 'Zero-knowledge privacy',
    color: '#00FF88'
  },
  {
    icon: ArrowRightLeft,
    title: 'Swap',
    description: 'Best rates across chains',
    color: '#00FF88'
  },
  {
    icon: TrendingUp,
    title: 'Earn',
    description: 'High-yield opportunities',
    color: '#00FF88'
  }
];

export function FeatureCards() {
  return (
    <section className="relative py-20 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/hex-grid.svg')] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#6B3FA0]/10 to-black" />
      
      <div className="relative max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center text-[#00FF88] mb-16 font-satoshi"
        >
          Core Features
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="relative hex-panel bg-black/60 backdrop-blur-xl border border-[#FFD700] p-8 rounded-xl"
            >
              <feature.icon className="w-12 h-12 mb-4" style={{ color: feature.color }} />
              <h3 className="text-xl font-bold font-satoshi text-[#00FF88] mb-2">
                {feature.title}
              </h3>
              <p className="text-white/80">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 