import React from 'react';
import { TokenMetadata } from '../types/wallet';

interface TokenListProps {
  tokens: TokenMetadata[];
  onTokenClick?: (token: TokenMetadata) => void;
  displayOptions?: {
    showFiatValue?: boolean;
    showChainIndicator?: boolean;
  };
  style?: {
    headerColor?: string;
    hoverEffect?: string;
  };
}

export const TokenList: React.FC<TokenListProps> = ({ 
  tokens,
  onTokenClick,
  displayOptions = {},
  style = {}
}) => {
  return (
    <div className="border rounded-lg shadow-sm">
      <h3 className="p-4 text-lg font-semibold border-b" style={{ color: style.headerColor }}>Tokens</h3>
      <div className="divide-y">
        {tokens.map((token) => (
          <div 
            key={token.address} 
            className={`p-4 ${style.hoverEffect === 'glow' ? 'hover:shadow-lg' : ''}`}
            onClick={() => onTokenClick?.(token)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-sm text-gray-500">{token.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{token.balance}</p>
                {displayOptions.showFiatValue && token.price && (
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