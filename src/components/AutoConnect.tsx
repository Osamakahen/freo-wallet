import { useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useWallet } from '../contexts/WalletContext';
import { Permission, SessionPermissions } from '../types/session';

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
  const { isAuthenticated, permissions } = useSession();
  const { connect, disconnect, selectedAddress } = useWallet();

  useEffect(() => {
    const autoConnect = async () => {
      if (!isAuthenticated) {
        try {
          await connect();
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, [isAuthenticated, connect]);

  const hasRequiredPermissions = requiredPermissions.every(permission =>
    permissions.includes(permission)
  );

  if (!isAuthenticated || !hasRequiredPermissions) {
    return null;
  }

  return (
    <div>
      <p>Connected to: {selectedAddress}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}; 