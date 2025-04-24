'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { CHAINS, getNetworkDetails } from '@/config/networks';
import { SessionService } from '@/services/SessionService';

const NetworkSelector: React.FC = () => {
  const { chainId, switchNetwork } = useWallet();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get current network name
  const getCurrentNetworkName = (): string => {
    if (!chainId) return 'Not Connected';
    const network = getNetworkDetails(chainId);
    return network?.chainName || 'Unknown Network';
  };

  // Handle network switch
  const handleNetworkSwitch = async (newChainId: string): Promise<void> => {
    if (newChainId === chainId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await switchNetwork(newChainId);
      
      // Update network preference for current dApp
      const origin = window.location.origin;
      await SessionService.getInstance().updateNetwork(origin, newChainId);
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <motion.button 
        className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-lg border border-[#00FF88]/20 text-white/80 hover:text-[#00FF88] transition-colors"
        onClick={toggleDropdown}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-sm font-medium">{getCurrentNetworkName()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>
      
      {isOpen && (
        <motion.div 
          className="absolute top-full right-0 mt-2 w-48 bg-black/80 backdrop-blur-md rounded-lg border border-[#00FF88]/20 shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {Object.entries(CHAINS).map(([id, network]) => (
            <motion.div 
              key={id}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                id === chainId 
                  ? 'bg-[#00FF88]/10 text-[#00FF88]' 
                  : 'hover:bg-white/5 text-white/80 hover:text-white'
              }`}
              onClick={() => handleNetworkSwitch(id)}
              whileHover={{ x: 2 }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: network.chainColor || '#00FF88' }}
              />
              <span className="text-sm font-medium">{network.chainName}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="w-5 h-5 text-[#00FF88] animate-spin" />
        </div>
      )}
    </div>
  );
};

export default NetworkSelector; 