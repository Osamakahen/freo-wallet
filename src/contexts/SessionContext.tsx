import React, { createContext, useContext, useState, useEffect } from 'react';
import { Permission } from '../types/session';

interface SessionContextType {
  isAuthenticated: boolean;
  permissions: Permission[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // Add your session check logic here
        const hasSession = localStorage.getItem('session');
        if (hasSession) {
          setIsAuthenticated(true);
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

  const login = async () => {
    try {
      // Add your login logic here
      setIsAuthenticated(true);
      // Set default permissions
      const defaultPermissions: Permission[] = ['read', 'write'];
      setPermissions(defaultPermissions);
      localStorage.setItem('session', 'true');
      localStorage.setItem('permissions', JSON.stringify(defaultPermissions));
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Add your logout logic here
      setIsAuthenticated(false);
      setPermissions([]);
      localStorage.removeItem('session');
      localStorage.removeItem('permissions');
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  };

  const checkPermission = (permission: Permission) => {
    return permissions.includes(permission);
  };

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        permissions,
        login,
        logout,
        checkPermission
      }}
    >
      {children}
    </SessionContext.Provider>
  );
} 