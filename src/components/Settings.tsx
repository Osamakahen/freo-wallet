import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

export const Settings: React.FC = () => {
  const { address } = useWallet();
  const { chainId, networkName } = useNetwork();
  const [activeSection, setActiveSection] = useState<string>('general');

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic wallet settings and preferences'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Security settings and backup options'
    },
    {
      id: 'network',
      title: 'Network',
      description: 'Network configuration and RPC endpoints'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select className="w-full p-2 border rounded">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select className="w-full p-2 border rounded">
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Backup</h3>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Backup Wallet
              </button>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Auto-Lock</h3>
              <select className="w-full p-2 border rounded">
                <option value="5">After 5 minutes</option>
                <option value="15">After 15 minutes</option>
                <option value="30">After 30 minutes</option>
                <option value="60">After 1 hour</option>
              </select>
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Current Network</h3>
              <p className="text-sm text-gray-600">
                {networkName} (Chain ID: {chainId})
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Custom RPC</h3>
              <input
                type="text"
                placeholder="https://..."
                className="w-full p-2 border rounded mb-2"
              />
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Add Network
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!address) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <p className="text-gray-500">Please connect your wallet to access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{section.title}</div>
                <div className="text-sm opacity-75">{section.description}</div>
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}; 