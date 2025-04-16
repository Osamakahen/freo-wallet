'use client'

import React from 'react'
import { FaFingerprint } from 'react-icons/fa'

interface BiometricPromptProps {
  onUnlock: () => Promise<void>
}

export function BiometricPrompt({ onUnlock }: BiometricPromptProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <FaFingerprint className="mx-auto text-6xl text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unlock Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Use biometric authentication to access your wallet
          </p>
          <button
            onClick={onUnlock}
            className="w-full bg-blue-600 text-white rounded-md py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Authenticate
          </button>
        </div>
      </div>
    </div>
  )
} 