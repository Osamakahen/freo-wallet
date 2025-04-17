import { useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useWallet } from '../contexts/WalletContext';
import { SessionPermissions } from '../types/session';

interface AutoConnectProps {
  requiredPermissions?: SessionPermissions;
  onConnect?: () => void;
  onError?: (error: string) => void;
}

export const AutoConnect: React.FC<AutoConnectProps> = ({
  requiredPermissions = {
    read: true,
    write: true,
    sign: true,
    connect: true,
    disconnect: true
  },
  onConnect,
  onError
}) => {
  const { isConnected, permissions } = useSession();
  const { connect, disconnect, address } = useWallet();

  useEffect(() => {
    const autoConnect = async () => {
      if (!isConnected) {
        try {
          await connect();
          if (onConnect) onConnect();
        } catch (error) {
          if (onError) onError(error instanceof Error ? error.message : 'Failed to connect');
        }
      }
    };

    autoConnect();
  }, [isConnected, connect, onConnect, onError]);

  const hasRequiredPermissions = Object.entries(requiredPermissions).every(
    ([key, value]) => permissions[key as keyof SessionPermissions] === value
  );

  if (!isConnected || !hasRequiredPermissions) {
    return null;
  }

  return (
    <div>
      <p>Connected to: {address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}; 