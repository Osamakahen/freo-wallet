import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DAppPermission, DAppSession } from "@/types/dapp"
import { useDApp } from "@/contexts/DAppContext"

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
  const [sessions, setSessions] = useState<DAppSession[]>([])

  useEffect(() => {
    if (isConnected) {
      const state = bridge.getState()
      if (state.address) {
        // Mock sessions for now - replace with actual session management
        setSessions([{
          dappId: 'example-dapp',
          address: state.address,
          permissions: ['read', 'transaction'],
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          deviceFingerprint: '',
          timestamp: Date.now()
        }])
      }
    } else {
      setSessions([])
    }
  }, [bridge, isConnected])

  const handleDisconnect = async (dappId: string) => {
    setDisconnecting(dappId)
    try {
      await bridge.disconnect()
      setSessions(prev => prev.filter(session => session.dappId !== dappId))
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Connected DApps</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-500">No connected DApps</p>
      ) : (
        <div className="h-[300px] w-full">
          <ScrollArea className="h-full w-full rounded-md border">
            <div className="p-4">
              <div className="space-y-4">
                {sessions.map((session: DAppSession) => (
                  <Card key={session.dappId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{session.dappId}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Connected: {new Date(session.timestamp).toLocaleString()}</p>
                        <div className="flex flex-wrap gap-2">
                          {session.permissions.map((permission: DAppPermission) => (
                            <Badge key={permission} variant="secondary">
                              {getPermissionLabel(permission)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        className="h-8 rounded-md px-3 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handleDisconnect(session.dappId)}
                        disabled={disconnecting === session.dappId}
                      >
                        {disconnecting === session.dappId ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  )
} 