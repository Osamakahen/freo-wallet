import React, { createContext, useContext, useState, useEffect } from 'react';
import { Permission, SessionPermissions } from '../types/session';

interface SessionContextType {
  isConnected: boolean;
  address: string | null;
  permissions: SessionPermissions;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const SessionContext = createContext<SessionContextType>({
  isConnected: false,
  address: null,
  permissions: {
    read: false,
    write: false,
    sign: false,
    connect: false,
    disconnect: false
  },
  connect: async () => {},
  disconnect: () => {}
});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<SessionPermissions>({
    read: false,
    write: false,
    sign: false,
    connect: false,
    disconnect: false
  });

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // Add your session check logic here
        const hasSession = localStorage.getItem('session');
        if (hasSession) {
          setIsConnected(true);
          // Load permissions from storage or API
          const storedPermissions = localStorage.getItem('permissions');
          if (storedPermissions) {
            setPermissions(JSON.parse(storedPermissions));
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      }
    };

    checkSession();
  }, []);

  const connect = async () => {
    try {
      // Add your connect logic here
      setIsConnected(true);
      // Set default permissions
      const defaultPermissions: SessionPermissions = {
        read: true,
        write: true,
        sign: true,
        connect: true,
        disconnect: true
      };
      setPermissions(defaultPermissions);
      localStorage.setItem('session', 'true');
      localStorage.setItem('permissions', JSON.stringify(defaultPermissions));
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  };

  const disconnect = () => {
    try {
      // Add your disconnect logic here
      setIsConnected(false);
      setPermissions({
        read: false,
        write: false,
        sign: false,
        connect: false,
        disconnect: false
      });
      localStorage.removeItem('session');
      localStorage.removeItem('permissions');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        isConnected,
        address,
        permissions,
        connect,
        disconnect
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}; 