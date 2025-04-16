'use client'

import React, { useState, useEffect } from 'react'
import { type Address } from 'viem'
import { FaPlug, FaTrash, FaExternalLinkAlt } from 'react-icons/fa'
import { type DAppManifest } from '../core/dapp/DAppBridge'
import Image from 'next/image'

interface DAppConnectionsProps {
  address: Address
}

export function DAppConnections({ address }: DAppConnectionsProps) {
  const [connectedDApps, setConnectedDApps] = useState<DAppManifest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        // In a real implementation, we would fetch this from SessionManager
        const mockDApps: DAppManifest[] = [
          {
            name: 'Example DApp',
            origin: 'https://example.com',
            icon: 'https://example.com/icon.png',
            scopes: ['read', 'transaction']
          },
          // Add more mock dApps here
        ]

        setConnectedDApps(mockDApps)
      } catch (error) {
        console.error('Error fetching dApp connections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConnections()
  }, [address])

  const handleDisconnect = async (origin: string) => {
    try {
      // In a real implementation, we would call SessionManager.revokeSession
      setConnectedDApps((prev) => prev.filter((dapp) => dapp.origin !== origin))
    } catch (error) {
      console.error('Error disconnecting dApp:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Connected DApps</h2>
        <span className="text-gray-500">{connectedDApps.length} connections</span>
      </div>

      {connectedDApps.length === 0 ? (
        <div className="text-center py-12">
          <FaPlug className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Connected DApps</h3>
          <p className="text-gray-500">
            You haven&apos;t connected to any decentralized applications yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {connectedDApps.map((dapp) => (
            <div
              key={dapp.origin}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {dapp.icon ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={dapp.icon}
                      alt={`${dapp.name} icon`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaPlug className="text-gray-400 text-xl" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{dapp.name}</h3>
                  <p className="text-sm text-gray-500">{dapp.origin}</p>
                  <div className="flex gap-2 mt-1">
                    {dapp.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={dapp.origin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FaExternalLinkAlt />
                </a>
                <button
                  onClick={() => handleDisconnect(dapp.origin)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 