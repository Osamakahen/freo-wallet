'use client';

import { motion } from 'framer-motion';

interface ActionButtonProps {
  icon: string;
  label: string;
  glow: 'green' | 'gold';
}

export const ActionButton = ({ icon, label, glow }: ActionButtonProps) => {
  return (
    <motion.button
      className={`flex flex-col items-center justify-center p-3 rounded-lg cyberpunk-border ${
        glow === 'green' ? 'hover:shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium cyberpunk-text">{label}</span>
    </motion.button>
  );
}; 