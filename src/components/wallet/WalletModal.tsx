'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '@/constants/colors';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedWallets: string[];
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  theme?: {
    primary: string;
    secondary: string;
    background: string;
  };
  walletOptions?: Array<{
    id: string;
    name: string;
    icon: string;
    isRecommended?: boolean;
  }>;
  connectionStatus?: React.ReactNode;
}

export const WalletModal = ({ isOpen, onClose, detectedWallets, onConnect, onDisconnect }: WalletModalProps) => {
  const handleWalletSelect = async () => {
    await onConnect();
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.primary }}>
                  Connect Wallet
                </h2>
                <div className="space-y-3">
                  {detectedWallets.map((wallet) => (
                    <button
                      key={wallet}
                      onClick={() => handleWalletSelect()}
                      className="w-full p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{wallet}</span>
                      <span className="text-sm text-gray-500">Click to connect</span>
                    </button>
                  ))}
                  {detectedWallets.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No wallets detected. Please install a wallet extension.
                    </p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={handleDisconnect}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 