'use client';

import { useNetwork } from '@/contexts/NetworkContext';
import { motion } from 'framer-motion';

interface NetworkStatusBadgeProps {
  chain: string;
}

export const NetworkStatusBadge = ({ chain }: NetworkStatusBadgeProps) => {
  const { chainId, networkName } = useNetwork();

  return (
    <motion.div
      className="flex items-center space-x-2 px-3 py-1 rounded-full cyberpunk-border"
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
      <span className="text-sm font-medium cyberpunk-text">
        {networkName || 'Multi-Chain'}
      </span>
    </motion.div>
  );
}; 