'use client'

import React, { useState, useEffect } from 'react'
import { type Address } from 'viem'
import { type ChainConfig } from '../core/chain/ChainAdapter'
import { FaImage, FaSpinner } from 'react-icons/fa'
import Image from 'next/image'

interface NFT {
  id: string
  name: string
  description: string
  image: string
  collection: string
  tokenId: string
  contractAddress: Address
}

interface NFTGalleryProps {
  address: Address
  network: ChainConfig
}

export function NFTGallery({ address, network }: NFTGalleryProps) {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        // In a real implementation, we would fetch NFTs from an API like Alchemy or Moralis
        // This is just example data
        const mockNFTs: NFT[] = [
          {
            id: '1',
            name: 'Example NFT #1',
            description: 'This is an example NFT',
            image: 'https://example.com/nft1.png',
            collection: 'Example Collection',
            tokenId: '1',
            contractAddress: '0x...' as Address,
          },
          // Add more mock NFTs here
        ]

        setNfts(mockNFTs)
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNFTs()
  }, [address, network])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your NFTs</h2>
        <span className="text-gray-500">{nfts.length} items</span>
      </div>

      {nfts.length === 0 ? (
        <div className="text-center py-12">
          <FaImage className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No NFTs Found</h3>
          <p className="text-gray-500">
            You don&apos;t have any NFTs in your wallet on this network
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedNFT(nft)}
            >
              <div className="relative aspect-square">
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.png' // Add a placeholder image
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {nft.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">{nft.collection}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="relative aspect-square mb-4">
              <Image
                src={selectedNFT.image}
                alt={selectedNFT.name}
                fill
                className="object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.png'
                }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2">{selectedNFT.name}</h3>
            <p className="text-gray-600 mb-4">{selectedNFT.description}</p>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Collection:</span>{' '}
                {selectedNFT.collection}
              </p>
              <p>
                <span className="font-medium">Token ID:</span> {selectedNFT.tokenId}
              </p>
              <p>
                <span className="font-medium">Contract:</span>{' '}
                {selectedNFT.contractAddress}
              </p>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setSelectedNFT(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 