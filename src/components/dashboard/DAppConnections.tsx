import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { DAppSession, DAppPermission, SessionPermissions } from '../../types/dapp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge, type BadgeVariant } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

const convertToSessionPermissions = (permissions: DAppPermission[]): SessionPermissions => {
  return {
    read: permissions.includes('read'),
    write: permissions.includes('transaction'),
    sign: permissions.includes('message-sign'),
    nft: permissions.includes('assets')
  };
};

export const DAppConnections: React.FC = () => {
  const { connectedDApps, disconnectDApp } = useDApp();
  const [sessions, setSessions] = useState<DAppSession[]>([]);

  useEffect(() => {
    setSessions(connectedDApps);
  }, [connectedDApps]);

  const handleDisconnect = async (dappId: string) => {
    await disconnectDApp(dappId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected DApps</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No DApps connected</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const permissions = convertToSessionPermissions(session.permissions);
                return (
                  <div key={session.dappId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{session.dappId}</div>
                      <div className="text-sm text-muted-foreground">
                        {permissions.read && <Badge variant="secondary" className="mr-2">Read</Badge>}
                        {permissions.write && <Badge variant="secondary" className="mr-2">Write</Badge>}
                        {permissions.sign && <Badge variant="secondary" className="mr-2">Sign</Badge>}
                        {permissions.nft && <Badge variant="secondary" className="mr-2">NFT</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(session.dappId)}
                    >
                      Disconnect
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}; 