import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollAreaViewport } from '@/components/ui/scroll-area'
import { DAppPermission, DAppSession } from '@/types/dapp'
import { useDApp } from '@/contexts/DAppContext'

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
  const { bridge, isConnected, currentAccount } = useDApp()
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [sessions, setSessions] = useState<DAppSession[]>([])

  const handleDisconnect = async (dappId: string) => {
    try {
      setDisconnecting(dappId)
      await bridge.disconnect()
      setSessions(prev => prev.filter(session => session.dappId !== dappId))
    } catch (error) {
      console.error('Failed to disconnect from DApp:', error)
    } finally {
      setDisconnecting(null)
    }
  }

  React.useEffect(() => {
    if (isConnected && currentAccount) {
      // Mock sessions for now - replace with actual session management
      setSessions([{
        dappId: 'example-dapp',
        address: currentAccount,
        permissions: ['read', 'transaction'],
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        deviceFingerprint: '',
        timestamp: Date.now()
      }])
    } else {
      setSessions([])
    }
  }, [isConnected, currentAccount])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DApp Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to view DApp connections.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>DApp Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <ScrollAreaViewport>
            <div className="space-y-4">
              {sessions.map((session: DAppSession) => (
                <div key={session.dappId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{session.dappId}</h3>
                    <div className="flex gap-2">
                      {session.permissions.map((permission: DAppPermission) => (
                        <Badge key={permission} variant="secondary">
                          {getPermissionLabel(permission)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 rounded-md px-3 text-xs"
                    onClick={() => handleDisconnect(session.dappId)}
                    disabled={disconnecting === session.dappId}
                  >
                    {disconnecting === session.dappId ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-muted-foreground">No active DApp connections.</p>
              )}
            </div>
          </ScrollAreaViewport>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 