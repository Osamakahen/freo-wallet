import React, { useState, useEffect } from 'react';
import { Wallet as WalletCore } from '../core/wallet/Wallet';
import { TransactionManager } from '../core/transaction/TransactionManager';
import { TokenManager } from '../core/token/TokenManager';
import { TokenList } from './TokenList';
import { SendToken } from './SendToken';
import TransactionHistory from './TransactionHistory';
import { TransactionStatus } from './TransactionStatus';
import { TokenMetadata, TransactionRequest, TokenBalance, WalletConfig } from '../types/wallet';

export const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletCore | null>(null);
  const [transactionManager, setTransactionManager] = useState<TransactionManager | null>(null);
  const [tokenManager, setTokenManager] = useState<TokenManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [activeTransaction, setActiveTransaction] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const config: WalletConfig = {
          networkName: 'mainnet',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/your-api-key'
        };
        const walletInstance = new WalletCore(config);
        await walletInstance.initialize();
        setWallet(walletInstance);
        setIsConnected(true);

        const transactionManagerInstance = new TransactionManager(walletInstance);
        setTransactionManager(transactionManagerInstance);

        const tokenManagerInstance = new TokenManager(walletInstance);
        setTokenManager(tokenManagerInstance);

        // Load initial balance
        if (walletInstance.state.address) {
          const initialBalance = await walletInstance.getBalance(walletInstance.state.address);
          setBalance(initialBalance);

          // Load tokens
          const tokenBalances = await tokenManagerInstance.getTokenBalances(walletInstance.state.address);
          setTokens(tokenBalances.map((token: TokenBalance) => ({
            address: token.address,
            name: '',  // TokenBalance doesn't include name, would need to fetch from token contract
            symbol: token.symbol,
            decimals: token.decimals,
            balance: token.balance.toString()
          })));
        }
      } catch (err) {
        setError('Failed to initialize wallet');
        console.error(err);
      }
    };

    initializeWallet();
  }, []);

  const handleSendToken = async (to: `0x${string}`, amount: string, tokenAddress?: `0x${string}`) => {
    if (!wallet || !transactionManager || !wallet.state.address) return;

    try {
      setError(null);
      const request: TransactionRequest = {
        from: wallet.state.address,
        to: tokenAddress || to,
        value: tokenAddress ? '0' : amount,
        data: tokenAddress && tokenManager ? tokenManager.encodeTransferData(to, amount) : '0x',
        chainId: 1
      };
      const txHash = await transactionManager.sendTransaction(request);
      setActiveTransaction(txHash as `0x${string}`);
    } catch (err) {
      setError('Failed to send transaction');
      console.error(err);
    }
  };

  const handleTransactionComplete = () => {
    setActiveTransaction(null);
    // Refresh balance and tokens
    if (wallet) {
      const walletState = wallet.getState();
      if (walletState.address) {
        // Update balance from wallet state
        setBalance(walletState.balance);
        
        // Update tokens if tokenManager is available
        if (tokenManager) {
          tokenManager.getTokenList().then(tokenAddresses => {
            Promise.all(
              tokenAddresses.map(tokenAddress => 
                tokenManager.getTokenBalance(tokenAddress, walletState.address as `0x${string}`)
              )
            ).then(balances => {
              setTokens(balances.map(token => ({
                address: token.tokenAddress,
                symbol: token.symbol,
                decimals: token.decimals,
                balance: token.balance.toString()
              })));
            });
          });
        }
      }
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-4">
        <button
          onClick={() => wallet?.connect()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Freo Wallet</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-lg font-semibold">{balance} ETH</p>
        </div>
      </div>

      {activeTransaction && transactionManager && (
        <TransactionStatus
          txHash={activeTransaction}
          transactionManager={transactionManager}
          onComplete={handleTransactionComplete}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SendToken
            onSend={handleSendToken}
            balance={balance}
            tokens={tokens}
          />
          <TokenList tokens={tokens} />
        </div>
        <div>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}; 