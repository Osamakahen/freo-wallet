'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { Session } from '@/services/SessionService';

interface SessionManagerProps {
  onClose: () => void;
}

export function SessionManager({ onClose }: SessionManagerProps) {
  const { connectedDapps, disconnectDapp } = useSession();
  const [isClosing, setIsClosing] = useState(false);

  const handleDisconnect = async (domain: string) => {
    await disconnectDapp(domain);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/80 backdrop-blur-md rounded-xl border border-[#00FF88]/20 w-full max-w-lg max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#00FF88]/20">
          <h2 className="text-xl font-semibold text-white">Manage dApp Sessions</h2>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-64px)]">
          {connectedDapps.length > 0 ? (
            <div className="space-y-4">
              {connectedDapps.map((session: Session, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-[#00FF88]/20 rounded-lg p-4 bg-black/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {session.favicon && (
                        <img src={session.favicon} alt="" className="w-6 h-6 rounded" />
                      )}
                      <div>
                        <h3 className="font-medium text-white">
                          {session.name || session.domain}
                        </h3>
                        <p className="text-sm text-white/60">{session.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <a
                        href={`https://${session.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00FF88] hover:text-[#00FF88]/80 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button
                        onClick={() => handleDisconnect(session.domain)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="flex items-center space-x-1 text-white/60">
                      <Clock size={14} />
                      <span>Connected: {new Date(session.connectedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-white/60">
                      <RefreshCw size={14} />
                      <span>
                        Expires: {new Date(session.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60">No active dApp sessions</p>
            </div>
          )}
        </div>
        
        <div className="border-t border-[#00FF88]/20 p-4 flex justify-end">
          <button
            onClick={handleClose}
            className="bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 