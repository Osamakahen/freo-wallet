import React from 'react';
import { TokenMetadata } from '../types/wallet';

interface TokenListProps {
  tokens: TokenMetadata[];
}

export const TokenList: React.FC<TokenListProps> = ({ tokens }) => {
  return (
    <div className="border rounded-lg shadow-sm">
      <h3 className="p-4 text-lg font-semibold border-b">Tokens</h3>
      <div className="divide-y">
        {tokens.map((token) => (
          <div key={token.address} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-sm text-gray-500">{token.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{token.balance}</p>
                {token.price && (
                  <p className="text-sm text-gray-500">
                    ${(Number(token.balance) * token.price).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 