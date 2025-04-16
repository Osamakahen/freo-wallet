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
  const { connectedDApps, disconnectDApp } = useDApp();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const handleDisconnect = async (dappId: string) => {
    setDisconnecting(dappId);
    try {
      await disconnectDApp(dappId);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Connected DApps</h2>
      <ScrollArea className="h-[300px]">
        {connectedDApps.length === 0 ? (
          <p className="text-gray-500">No connected DApps</p>
        ) : (
          <div className="space-y-4">
            {connectedDApps.map((dapp) => (
              <Card key={dapp.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {dapp.icon && (
                        <img src={dapp.icon} alt={dapp.name} className="w-6 h-6 rounded" />
                      )}
                      <h3 className="font-medium">{dapp.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{dapp.origin}</p>
                    <div className="flex flex-wrap gap-2">
                      {dapp.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {getPermissionLabel(permission)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(dapp.id)}
                    disabled={disconnecting === dapp.id}
                  >
                    {disconnecting === dapp.id ? "Disconnecting..." : "Disconnect"}
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