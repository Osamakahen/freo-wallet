import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { DAppSession } from '../../types/dapp';
import { formatDistanceToNow } from 'date-fns';

export const DAppConnections: React.FC = () => {
  const { connectedDApps, disconnectDApp } = useDApp();
  const [sessions, setSessions] = useState<DAppSession[]>([]);

  useEffect(() => {
    setSessions(connectedDApps);
  }, [connectedDApps]);

  const handleDisconnect = async (origin: string) => {
    await disconnectDApp(origin);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Connected dApps</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No connected dApps</p>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.origin}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-3">
                  {session.icon && (
                    <img
                      src={session.icon}
                      alt={session.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{session.name}</h3>
                    <p className="text-sm text-gray-500">{session.origin}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Connected {formatDistanceToNow(session.connectedAt)} ago
                </p>
              </div>
              <button
                onClick={() => handleDisconnect(session.origin)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 