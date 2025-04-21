'use client';

import { useState } from 'react';
import { NETWORKS } from '@/config/networks';
import { useWallet } from '@/hooks/useWallet';

export default function Home() {
  const { state, connect, disconnect, isConnecting } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold">Freo Wallet</h1>
        <div>
          {!state.isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {state.address?.slice(0, 6)}...{state.address?.slice(-4)}
              </span>
              <span className="text-sm">{state.balance} ETH</span>
              <button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">Select Network</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NETWORKS.map((network) => (
            <button
              key={network.chainId}
              onClick={() => setSelectedNetwork(network)}
              className={`p-6 border rounded-lg shadow-sm transition-all ${
                selectedNetwork.chainId === network.chainId
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{network.name}</h2>
                  <p className="text-gray-600">Chain ID: {network.chainId}</p>
                  <p className="text-gray-600">Symbol: {network.symbol}</p>
                </div>
                {network.iconUrl && (
                  <img
                    src={network.iconUrl}
                    alt={`${network.name} logo`}
                    className="w-8 h-8"
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {state.isConnected && (
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl font-semibold mb-4">Wallet Details</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{state.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Network</p>
                <p className="font-medium">{state.network}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="font-medium">{state.balance} {selectedNetwork.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Chain ID</p>
                <p className="font-medium">{state.chainId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 