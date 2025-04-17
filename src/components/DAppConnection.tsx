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
        { type: 'read', description: 'Read account data' },
        { type: 'write', description: 'Write to account' },
        { type: 'transaction', description: 'Send transactions' },
        { type: 'message-sign', description: 'Sign messages' },
        { type: 'nft-access', description: 'Access NFT data' }
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
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div>
          <h3 className="font-medium">{metadata.name}</h3>
          <p className="text-sm text-gray-500">{metadata.description}</p>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-2 bg-red-50 text-red-500 rounded text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`mt-4 w-full py-2 px-4 rounded ${
          isConnecting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    </div>
  );
}; 