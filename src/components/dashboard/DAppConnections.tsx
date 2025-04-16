import { useState } from 'react'
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
  const { sessions, disconnectDApp } = useDApp()
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const handleDisconnect = async (dappId: string) => {
    setDisconnecting(dappId)
    try {
      await disconnectDApp(dappId)
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Connected DApps</h2>
      <ScrollArea className="h-[300px]">
        {sessions.length === 0 ? (
          <p className="text-gray-500">No connected DApps</p>
        ) : (
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
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(session.dappId)}
                    disabled={disconnecting === session.dappId}
                  >
                    {disconnecting === session.dappId ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
} 