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
  const { bridge, isConnected } = useDApp()
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const handleDisconnect = async (dappId: string) => {
    try {
      setDisconnecting(dappId)
      await bridge?.endSession(dappId)
    } catch (error) {
      console.error('Failed to disconnect from DApp:', error)
    } finally {
      setDisconnecting(null)
    }
  }

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
              {bridge?.sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{session.origin}</h3>
                    <div className="flex gap-2">
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
                    onClick={() => handleDisconnect(session.id)}
                    disabled={disconnecting === session.id}
                  >
                    {disconnecting === session.id ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              ))}
              {bridge?.sessions.length === 0 && (
                <p className="text-muted-foreground">No active DApp connections.</p>
              )}
            </div>
          </ScrollAreaViewport>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 