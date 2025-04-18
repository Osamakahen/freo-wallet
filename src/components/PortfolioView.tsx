'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { type Address } from 'viem'
import { useBalance, useToken } from 'wagmi'
import { type ChainConfig } from '../core/chain/ChainAdapter'
import { FaEthereum, FaArrowRight } from 'react-icons/fa'

interface Token {
  address: Address
  symbol: string
  balance: string
  price?: number
}

interface PortfolioViewProps {
  address: Address
  network: ChainConfig
}

export function PortfolioView({ address, network }: PortfolioViewProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')

  const { data: nativeBalance } = useBalance({
    address,
    chainId: network.chainId,
  })

  // Common token addresses for the network
  const commonTokens = useMemo(() => [
    '0x...' as Address, // Example token addresses
    '0x...' as Address,
  ], [])

  const { data: tokenInfo } = useToken({
    address: commonTokens[0], // Use the first token for now
    chainId: network.chainId,
  })

  useEffect(() => {
    if (tokenInfo) {
      setTokens([{
        address: commonTokens[0],
        symbol: tokenInfo.symbol || 'UNKNOWN',
        balance: '0',
        price: 0,
      }])
      setIsLoading(false)
    }
  }, [tokenInfo, commonTokens])

  const handleSend = async () => {
    if (!selectedToken || !recipientAddress || !amount) return

    try {
      // Implementation would depend on your transaction handling system
      console.log('Sending transaction:', {
        token: selectedToken,
        to: recipientAddress,
        amount,
      })

      // Reset form
      setSelectedToken(null)
      setRecipientAddress('')
      setAmount('')
    } catch (error) {
      console.error('Transaction failed:', error)
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
      {/* Native Balance */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <FaEthereum className="text-2xl" />
          <h3 className="text-xl font-semibold">Native Balance</h3>
        </div>
        <p className="text-3xl font-bold">
          {nativeBalance?.formatted} {nativeBalance?.symbol}
        </p>
      </div>

      {/* Token List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Tokens</h3>
        </div>
        <div className="divide-y">
          {tokens.map((token) => (
            <div
              key={token.address}
              className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedToken(token)}
            >
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-sm text-gray-500">
                  Balance: {token.balance}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ${(Number(token.balance) * (token.price || 0)).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  ${token.price?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Form */}
      {selectedToken && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Send {selectedToken.symbol}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.0"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!recipientAddress || !amount}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Send <FaArrowRight className="inline ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 