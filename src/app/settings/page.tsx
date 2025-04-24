'use client';

import React from 'react';
import { SessionManager } from '@/components/SessionManager';
import { useWallet } from '@/contexts/WalletContext';

export default function SettingsPage() {
  const { account } = useWallet();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section className="bg-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connected dApps</h2>
          <SessionManager onClose={() => {}} />
        </section>

        {!account && (
          <div className="text-center py-8">
            <p className="text-white/60">Connect your wallet to manage dApp connections</p>
          </div>
        )}
      </div>
    </div>
  );
} 