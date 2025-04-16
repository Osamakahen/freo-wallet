import React, { useState, useEffect } from 'react';
import { useDApp } from '../contexts/DAppContext';
import { DAppMetadata, DAppPermission, SessionPermissions } from '../types/dapp';
import Image from 'next/image';

interface DAppConnectionProps {
  metadata: DAppMetadata & { permissions: DAppPermission[] };
  onConnect: (accounts: string[]) => void;
  onError: (error: string) => void;
}

const convertToSessionPermissions = (permissions: DAppPermission[]): SessionPermissions => {
  return {
    read: permissions.includes('read'),
    write: permissions.includes('transaction'),
    sign: permissions.includes('message-sign'),
    nft: permissions.includes('assets')
  };
};

const convertToPermissionArray = (permissions: SessionPermissions): DAppPermission[] => {
  const result: DAppPermission[] = [];
  if (permissions.read) result.push('read');
  if (permissions.write) result.push('transaction');
  if (permissions.sign) result.push('message-sign');
  if (permissions.nft) result.push('assets');
  return result;
};

export const DAppConnection: React.FC<DAppConnectionProps> = ({
  metadata,
  onConnect,
  onError,
}) => {
  const { isConnected, currentAccount, connect, requestAccounts, requestPermissions, loading, error } = useDApp();
  const [permissionsGranted, setPermissionsGranted] = useState<DAppPermission[]>([]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleConnect = async () => {
    try {
      // Request connection
      await connect();
      const accounts = await requestAccounts();
      onConnect(accounts);

      // Request permissions
      const sessionPermissions = convertToSessionPermissions(metadata.permissions);
      const grantedPermissions = await requestPermissions(sessionPermissions);
      setPermissionsGranted(convertToPermissionArray(grantedPermissions));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleDisconnect = () => {
    // In a real implementation, this would trigger the disconnect flow
    onError('Please disconnect through the wallet interface');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex items-center space-x-4 mb-4">
        <div className="dapp-icon">
          <Image
            src={metadata.icon}
            alt={`${metadata.name} icon`}
            width={40}
            height={40}
            loading="lazy"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{metadata.name}</h3>
          <p className="text-sm text-gray-500">{metadata.description}</p>
        </div>
      </div>

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Connected Account:</span>
            <span className="font-mono text-sm">{currentAccount}</span>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Granted Permissions:</h4>
            <ul className="space-y-1">
              {permissionsGranted.map((permission) => (
                <li key={permission} className="text-sm text-gray-600">
                  • {permission}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}; 