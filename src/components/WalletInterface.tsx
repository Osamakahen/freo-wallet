'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { type ChainConfig } from '../core/chain/ChainAdapter'
import { PortfolioView } from './PortfolioView'
import TransactionHistory from './TransactionHistory'
import { NFTGallery } from './NFTGallery'
import { DAppConnections } from './DAppConnections'
import { BiometricPrompt } from './BiometricPrompt'
import { injected } from 'wagmi/connectors'

interface WalletInterfaceProps {
  initialNetwork: ChainConfig
  availableNetworks: ChainConfig[]
}

export function WalletInterface({ initialNetwork }: WalletInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions' | 'nfts' | 'dapps'>('portfolio')
  const [isLocked, setIsLocked] = useState(true)
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout>()
  
  const { address } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Auto-lock after inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      setInactivityTimer(setTimeout(() => setIsLocked(true), 10 * 60 * 1000)) // 10 minutes
    }

    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keypress', resetTimer)

    return () => {
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keypress', resetTimer)
      if (inactivityTimer) clearTimeout(inactivityTimer)
    }
  }, [inactivityTimer])

  const handleUnlock = async () => {
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4]),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
        },
      })
      setIsLocked(false)
    } catch (error) {
      console.error('Biometric authentication failed:', error)
    }
  }

  if (isLocked) {
    return <BiometricPrompt onUnlock={handleUnlock} />
  }

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button
          onClick={() => connect({ connector: injected() })}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">FreoWallet</h1>
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <nav className="flex space-x-4 mb-8">
          {(['portfolio', 'transactions', 'nfts', 'dapps'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'portfolio' && <PortfolioView address={address} />}
          {activeTab === 'transactions' && (
            <TransactionHistory address={address} network={initialNetwork} />
          )}
          {activeTab === 'nfts' && <NFTGallery address={address} />}
          {activeTab === 'dapps' && <DAppConnections />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500">
            FreoWallet v1.0.0 - Secure, Non-custodial Wallet
          </p>
        </div>
      </footer>
    </div>
  )
} 