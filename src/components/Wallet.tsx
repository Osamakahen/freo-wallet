import React, { useState, useEffect } from 'react';
import { Wallet } from '../core/wallet/Wallet';
import { TokenBalance } from '../types/token';
import { TransactionRequest, TransactionReceipt } from '../types/wallet';
import { TokenList } from './TokenList';
import { SendToken } from './SendToken';
import TransactionHistory from './TransactionHistory';
import { TransactionStatus } from './TransactionStatus';
import { TokenMetadata, WalletConfig } from '../types/wallet';

interface Props {
  wallet: Wallet;
}

export const WalletComponent: React.FC<Props> = ({ wallet }) => {
  const [balance, setBalance] = useState<string>('0');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [activeTransaction, setActiveTransaction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const state = wallet.getState();
        setBalance(state.balance);

        const tokenList = await wallet.getTokenList();
        const tokenBalances = await Promise.all(
          tokenList.map(async (tokenAddress) => {
            return wallet.getTokenBalance(tokenAddress, state.address as `0x${string}`);
          })
        );
        setTokens(tokenBalances);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      }
    };

    loadWalletData();
  }, [wallet]);

  const handleSendToken = async (tokenAddress: `0x${string}`, to: `0x${string}`, amount: string) => {
    try {
      const state = wallet.getState();
      if (!state.address) {
        throw new Error('Wallet not connected');
      }

      const data = await wallet.getTokenTransferData(tokenAddress, to, amount);
      const transaction: TransactionRequest = {
        from: state.address,
        to: tokenAddress,
        value: BigInt(0),
        data
      };

      const hash = await wallet.sendTransaction(transaction);
      setActiveTransaction(hash);
    } catch (error) {
      console.error('Error sending token:', error);
    }
  };

  const handleTransactionComplete = async (hash: string) => {
    try {
      setActiveTransaction(null);
      const receipt = await wallet.getTransactionReceipt(hash);
      if (receipt) {
        const state = wallet.getState();
        setBalance(state.balance);

        const tokenList = await wallet.getTokenList();
        const tokenBalances = await Promise.all(
          tokenList.map(async (tokenAddress) => {
            return wallet.getTokenBalance(tokenAddress, state.address as `0x${string}`);
          })
        );
        setTokens(tokenBalances);
      }
    } catch (error) {
      console.error('Error handling transaction completion:', error);
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>Freo Wallet</h1>
        <div className="balance">Balance: {balance} ETH</div>
      </div>

      {activeTransaction && (
        <TransactionStatus
          txHash={activeTransaction}
          transactionManager={wallet}
          onComplete={handleTransactionComplete}
        />
      )}

      <div className="wallet-content">
        <div className="wallet-section">
          <SendToken
            onSend={handleSendToken}
            balance={balance}
            tokens={tokens}
          />
          <TokenList tokens={tokens} />
        </div>
        <div className="wallet-section">
          <TransactionHistory 
            address={wallet?.getState().address || '0x'}
            network={wallet?.getState().network || 'mainnet'}
          />
        </div>
      </div>
    </div>
  );
}; 