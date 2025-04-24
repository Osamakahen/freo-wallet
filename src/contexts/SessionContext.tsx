'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { SessionService } from '@/services/SessionService';

interface Session {
  domain: string;
  chainId: string;
  name: string;
  favicon: string;
  connectedAt: number;
  expiresAt: number;
  lastActivity: number;
}

interface SessionContextType {
  activeSessions: boolean;
  sessionExpiry: number | null;
  connectedDapps: Session[];
  refreshSessions: () => void;
  disconnectDapp: (domain: string) => Promise<void>;
  isAuthenticated: boolean;
  permissions: Record<string, boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { account, connected } = useWallet();
  const [activeSessions, setActiveSessions] = useState<boolean>(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [connectedDapps, setConnectedDapps] = useState<Session[]>([]);
  
  useEffect(() => {
    if (!connected || !account) return;
    
    // Load session data when wallet connects
    loadSessions();
    
    // Set up refresh interval
    const intervalId = setInterval(loadSessions, 30000);
    return () => clearInterval(intervalId);
  }, [connected, account]);
  
  const loadSessions = async () => {
    try {
      if (!account) return;
      const sessions = await SessionService.getActiveSessions(account);
      setConnectedDapps(sessions);
      setActiveSessions(sessions.length > 0);
      
      // Find the earliest expiry time
      if (sessions.length > 0) {
        const earliestExpiry = Math.min(...sessions.map(s => s.expiresAt));
        setSessionExpiry(earliestExpiry);
      } else {
        setSessionExpiry(null);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };
  
  const refreshSessions = () => {
    loadSessions();
  };
  
  const disconnectDapp = async (domain: string) => {
    try {
      if (!account) return;
      await SessionService.terminateSession(account, domain);
      refreshSessions();
    } catch (error) {
      console.error("Failed to disconnect dApp:", error);
    }
  };
  
  return (
    <SessionContext.Provider
      value={{
        activeSessions,
        sessionExpiry,
        connectedDapps,
        refreshSessions,
        disconnectDapp,
        isAuthenticated: activeSessions,
        permissions: {}
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
} 