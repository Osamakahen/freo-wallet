import { useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useWallet } from '../contexts/WalletContext';
import { Permission } from '../types/session';

interface AutoConnectProps {
  requiredPermissions?: Permission[];
}

export const AutoConnect = ({
  requiredPermissions = [],
}: AutoConnectProps) => {
  const { isAuthenticated, permissions } = useSession();
  const { connect, disconnect, account } = useWallet();

  useEffect(() => {
    if (isAuthenticated && !account) {
      connect();
    }
  }, [isAuthenticated, account, connect]);

  const hasRequiredPermissions = requiredPermissions.length === 0 || permissions;

  if (!isAuthenticated || !hasRequiredPermissions) {
    return null;
  }

  return (
    <div>
      <p>Connected to: {account}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}; 