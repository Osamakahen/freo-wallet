import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { DAppSession, DAppPermission } from '../../types/dapp';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area"

const getPermissionLabel = (permission: DAppPermission): string => {
  switch (permission) {
    case 'read': return 'Read'
    case 'transaction': return 'Transaction'
    case 'message-sign': return 'Sign Messages'
    case 'assets': return 'Assets'
    case 'history': return 'History'
    default: return permission
  }
}

export const DAppConnections: React.FC = () => {
  const { bridge } = useDApp();
  const [sessions, setSessions] = useState<DAppSession[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const state = bridge.getState();
        const dappInfo = bridge.getDAppInfo();
        if (dappInfo) {
          const defaultPermissions: DAppPermission[] = ['read'];
          setSessions([{
            dappId: dappInfo.origin,
            address: state.address || '0x0',
            deviceFingerprint: '',
            permissions: defaultPermissions,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
          }]);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        toast.error('Failed to load connected DApps');
      }
    };

    loadSessions();
  }, [bridge]);

  const handleDisconnect = async (dappId: string) => {
    try {
      setDisconnecting(dappId);
      await bridge.disconnect();
      setSessions(prev => prev.filter(session => session.dappId !== dappId));
      toast.success('DApp disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect DApp');
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Connected DApps</h2>
      <ScrollArea className="h-[300px]">
        {sessions.length === 0 ? (
          <p className="text-gray-500">No connected DApps</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.dappId} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {session.icon && (
                        <img src={session.icon} alt={session.name} className="w-6 h-6 rounded" />
                      )}
                      <h3 className="font-medium">{session.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{session.origin}</p>
                    <div className="flex flex-wrap gap-2">
                      {session.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {getPermissionLabel(permission)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(session.dappId)}
                  >
                    Disconnect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}; 