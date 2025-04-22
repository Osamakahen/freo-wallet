'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceDisplayProps {
  value: string;
  cryptoEquivalent: string;
  trend: 'up' | 'down';
}

export const BalanceDisplay = ({ value, cryptoEquivalent, trend }: BalanceDisplayProps) => {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-3xl font-bold cyberpunk-text">
          {value}
        </span>
        {trend === 'up' ? (
          <TrendingUp className="w-6 h-6 text-[#00FF88]" />
        ) : (
          <TrendingDown className="w-6 h-6 text-red-500" />
        )}
      </div>
      <p className="text-sm text-gray-400">
        {cryptoEquivalent}
      </p>
    </motion.div>
  );
}; 