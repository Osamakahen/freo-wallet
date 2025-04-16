import React, { useState, useEffect } from 'react';
import { useDApp } from '../../contexts/DAppContext';
import { DAppSession, DAppPermission, SessionPermissions } from '../../types/dapp';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
                        {permissions.read && <Badge className="mr-2 bg-secondary text-secondary-foreground">Read</Badge>}
                        {permissions.write && <Badge className="mr-2 bg-secondary text-secondary-foreground">Write</Badge>}
                        {permissions.sign && <Badge className="mr-2 bg-secondary text-secondary-foreground">Sign</Badge>}
                        {permissions.nft && <Badge className="mr-2 bg-secondary text-secondary-foreground">NFT</Badge>}
                      </div>
                    </div>
                    <button
                      className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs"
                      onClick={() => handleDisconnect(session.dappId)}
                    >
                      Disconnect
                    </button>
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