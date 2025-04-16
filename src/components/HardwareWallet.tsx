import React, { useState } from 'react';
import { HardwareWalletManager, HardwareWalletType } from '../core/wallet/HardwareWalletManager';

interface HardwareWalletProps {
  onConnect: (address: `0x${string}`) => void;
}

export const HardwareWallet: React.FC<HardwareWalletProps> = ({ onConnect }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<HardwareWalletType>('ledger');

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const walletManager = new HardwareWalletManager(selectedType);
      const address = await walletManager.connect();
      onConnect(address);

      const deviceInfo = await walletManager.getDeviceInfo();
      console.log('Connected to:', deviceInfo);
    } catch (err) {
      setError('Failed to connect hardware wallet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Hardware Wallet</h2>
      
      {loading && <div className="text-blue-500">Connecting to hardware wallet...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Wallet Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as HardwareWalletType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ledger">Ledger</option>
            <option value="trezor">Trezor</option>
          </select>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Connect Hardware Wallet
        </button>
      </div>
    </div>
  );
}; 