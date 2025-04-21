'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 px-3 py-2 text-sm rounded-lg shadow-lg"
            style={{
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              maxWidth: '200px',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
            }}
          >
            {content}
            <div
              className="absolute w-2 h-2 rotate-45"
              style={{
                backgroundColor: '#1E293B',
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 