'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedWallets: string[];
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isDevMode?: boolean;
}

export const WalletModal = ({ 
  isOpen, 
  onClose, 
  onConnect, 
  onDisconnect,
  isDevMode = false 
}: WalletModalProps) => {
  const handleConnect = async () => {
    await onConnect();
    onClose();
  };

  if (isDevMode) {
    // Auto-connect in dev mode
    handleConnect();
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#6B3FA0] bg-opacity-50 z-50 backdrop-blur-sm"
            style={{
              backgroundImage: "url('/geometric-pattern.svg')",
              backgroundBlendMode: "overlay"
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[#6B3FA0] rounded-xl shadow-xl overflow-hidden border border-[#A2E4B8]">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Connect Wallet
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={handleConnect}
                    className="w-full p-4 rounded-lg border border-[#A2E4B8] hover:bg-[#A2E4B8] hover:bg-opacity-20 transition-colors flex items-center justify-between text-white"
                  >
                    <span className="font-medium">Continue with Infura</span>
                    <span className="text-sm opacity-80">Development Mode</span>
                  </button>
                  <p className="text-center text-[#A2E4B8] py-4">
                    Using Infura API for development purposes
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#6B3FA0] border-t border-[#A2E4B8] flex justify-end">
                <button
                  onClick={onClose}
                  className="text-sm text-white hover:text-[#A2E4B8] transition-colors"
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