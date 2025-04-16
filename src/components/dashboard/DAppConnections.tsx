import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { DAppSession, DAppPermission } from '../../types/dapp';
import { formatDistanceToNow } from 'date-fns';

export const DAppConnections: React.FC = () => {
  const { bridge } = useDApp();
  const [sessions, setSessions] = useState<DAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, this would fetch from a backend
        const mockSessions: DAppSession[] = [
          {
            dappId: 'uniswap',
            address: '0x123...abc',
            permissions: [DAppPermission.READ, DAppPermission.TRANSACTION],
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            deviceFingerprint: 'device1',
          },
          {
            dappId: 'aave',
            address: '0x456...def',
            permissions: [DAppPermission.READ, DAppPermission.ASSETS],
            expiresAt: Date.now() + 12 * 60 * 60 * 1000,
            deviceFingerprint: 'device1',
          },
        ];

        setSessions(mockSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [bridge]);

  const handleRevoke = async (dappId: string) => {
    try {
      await bridge.revokeSession(dappId);
      setSessions(sessions.filter(session => session.dappId !== dappId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">Connected dApps</h2>
        
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.dappId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{session.dappId}</h3>
                  <p className="text-sm text-gray-500">
                    Connected {formatDistanceToNow(session.expiresAt - 24 * 60 * 60 * 1000)} ago
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(session.dappId)}
                  className="text-red-500 hover:text-red-700"
                >
                  Revoke
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {session.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Expires {formatDistanceToNow(session.expiresAt, { addSuffix: true })}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No active dApp connections
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 