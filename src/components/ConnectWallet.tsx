'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { SessionService } from '@/services/SessionService';
import { DAppSession } from '../services/SessionService';
import { Wallet, Loader2, Check, X } from 'lucide-react';

interface ConnectWalletProps {
  dappOrigin: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ dappOrigin }) => {
  const { connect, disconnect, account, chainId, switchNetwork } = useWallet();
  const [autoConnect, setAutoConnect] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionInfo, setSessionInfo] = useState<DAppSession | null>(null);

  useEffect(() => {
    // Check if there's an existing session for this dApp
    const checkSession = async () => {
      try {
        const session = await SessionService.getInstance().getSession(dappOrigin);
        if (session) {
          setSessionInfo(session);
          setAutoConnect(session.autoConnect);
          
          // Auto-connect if enabled
          if (session.autoConnect && !account) {
            await connect();
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      }
    };
    
    checkSession();
  }, [dappOrigin, account, connect]);

  // Handle connection
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await connect();
      
      // Create or update session
      if (account && chainId) {
        await SessionService.getInstance().createSession(
          dappOrigin,
          account,
          chainId,
          { eth_accounts: true, eth_chainId: true }
        );
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      await disconnect();
      await SessionService.getInstance().removeSession(dappOrigin);
      setSessionInfo(null);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  // Toggle auto-connect setting
  const toggleAutoConnect = async () => {
    const newValue = !autoConnect;
    setAutoConnect(newValue);
    
    if (sessionInfo) {
      await SessionService.getInstance().setAutoConnect(dappOrigin, newValue);
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Render component based on connection state
  if (account) {
    return (
      <motion.div 
        className="flex items-center gap-4 p-4 bg-black/20 backdrop-blur-sm rounded-lg border border-[#00FF88]/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00FF88]" />
            <span className="text-white/80 font-medium">{formatAddress(account)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FF88]" />
            <span className="text-sm text-white/60">Connected</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoConnect}
              onChange={toggleAutoConnect}
              className="w-4 h-4 rounded border-[#00FF88]/20 bg-black/20 checked:bg-[#00FF88] checked:border-[#00FF88]"
            />
            <span className="text-sm text-white/60">Auto-connect</span>
          </label>
          
          <motion.button 
            onClick={handleDisconnect}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleConnect}
      disabled={isLoading}
      className="flex items-center gap-2 px-6 py-3 bg-[#00FF88] text-black font-medium rounded-lg hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
        </>
      )}
    </motion.button>
  );
};

export default ConnectWallet; 