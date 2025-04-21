'use client';

import { NETWORKS } from '@/config/networks';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Freo Wallet</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
        {NETWORKS.map((network) => (
          <div key={network.chainId} className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{network.name}</h2>
            <p className="text-gray-600">Chain ID: {network.chainId}</p>
            <p className="text-gray-600">Symbol: {network.symbol}</p>
            {network.iconUrl && (
              <img src={network.iconUrl} alt={`${network.name} logo`} className="w-8 h-8 mt-2" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
} 