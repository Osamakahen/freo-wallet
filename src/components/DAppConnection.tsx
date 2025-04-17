import React, { useState } from 'react';
import { useDApp } from '../contexts/DAppContext';
import { DAppMetadata, Permission } from '../types/dapp';
import Image from 'next/image';

interface DAppConnectionProps {
  metadata: DAppMetadata;
  onConnect: (accounts: string[]) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

export const DAppConnection: React.FC<DAppConnectionProps> = ({
  metadata,
  onConnect,
  onError,
  onSuccess
}) => {
  const { connect, requestAccounts, requestPermissions } = useDApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const permissionsToRequest: Permission[] = [
        { type: 'read', description: 'Read wallet information' },
        { type: 'write', description: 'Write wallet information' },
        { type: 'message-sign', description: 'Sign messages' },
        { type: 'nft-access', description: 'Access NFTs' }
      ];

      await requestPermissions(permissionsToRequest);
      await connect();
      const accounts = await requestAccounts();
      onConnect(accounts);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        {metadata.icon && (
          <Image
            src={metadata.icon}
            alt={metadata.name}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div>
          <h3 className="text-lg font-semibold">{metadata.name}</h3>
          <p className="text-sm text-gray-500">{metadata.description}</p>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}; 