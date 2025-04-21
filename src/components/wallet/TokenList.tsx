import React from 'react';
import { TokenMetadata } from '../../types/wallet';

interface TokenListProps {
  tokens: TokenMetadata[];
}

export const TokenList: React.FC<TokenListProps> = ({ tokens }) => {
  return (
    <div className="border rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Tokens</h3>
      <div className="space-y-2">
        {tokens.map((token) => (
          <div key={token.address} className="flex justify-between items-center p-2 border rounded">
            <div>
              <p className="font-medium">{token.symbol}</p>
              <p className="text-sm text-gray-500">{token.name}</p>
            </div>
            <p className="font-medium">{token.balance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; 