import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DAppProvider, useDApp } from './contexts/DAppContext';
import { TokenProvider } from './contexts/TokenContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { GasProvider } from './contexts/GasContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { AddressBookProvider } from './contexts/AddressBookContext';
import { HardwareWalletProvider } from './contexts/HardwareWalletContext';
import { PortfolioView } from './components/PortfolioView';
import { SendToken } from './components/SendToken';
import TransactionHistory from './components/TransactionHistory';
import { NFTGallery } from './components/NFTGallery';
import { DAppConnections } from './components/DAppConnections';
import { BiometricPrompt } from './components/BiometricPrompt';
import { type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { NetworkManager } from './core/network/NetworkManager';
import { Toaster } from './components/ui/toaster';

// Default chain configuration
const defaultChainConfig = mainnet;

// Create singleton instances
const networkManager = new NetworkManager({
  networkName: defaultChainConfig.name,
  chainId: defaultChainConfig.id,
  rpcUrl: defaultChainConfig.rpcUrls.default.http[0]
});

const AppContent: React.FC = () => {
  const { currentAccount: address, isConnected } = useDApp();
  
  // Only render routes if wallet is connected
  if (!isConnected || !address) {
    return <div>Please connect your wallet</div>;
  }

  // Use networkManager to get current network info
  const currentNetwork = networkManager.getCurrentNetwork();

  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <PortfolioView 
                address={address as Address}
                network={{
                  name: currentNetwork?.networkName || defaultChainConfig.name,
                  symbol: defaultChainConfig.nativeCurrency.symbol,
                  chainId: currentNetwork?.chainId || defaultChainConfig.id,
                  rpcUrl: currentNetwork?.rpcUrl || defaultChainConfig.rpcUrls.default.http[0],
                  explorer: defaultChainConfig.blockExplorers?.default.url
                }}
              />
            } 
          />
          <Route 
            path="/send" 
            element={
              <SendToken 
                onSend={(to, amount, tokenAddress) => {
                  console.log('Sending', amount, 'to', to, 'token:', tokenAddress);
                }}
                balance="0"
                tokens={[]}
              />
            } 
          />
          <Route 
            path="/history" 
            element={
              <TransactionHistory 
                address={address as Address}
                network={{
                  name: currentNetwork?.networkName || defaultChainConfig.name,
                  symbol: defaultChainConfig.nativeCurrency.symbol,
                  chainId: currentNetwork?.chainId || defaultChainConfig.id,
                  rpcUrl: currentNetwork?.rpcUrl || defaultChainConfig.rpcUrls.default.http[0],
                  explorer: defaultChainConfig.blockExplorers?.default.url
                }}
              />
            } 
          />
          <Route 
            path="/nfts" 
            element={
              <NFTGallery 
                address={address as Address}
                network={{
                  name: currentNetwork?.networkName || defaultChainConfig.name,
                  symbol: defaultChainConfig.nativeCurrency.symbol,
                  chainId: currentNetwork?.chainId || defaultChainConfig.id,
                  rpcUrl: currentNetwork?.rpcUrl || defaultChainConfig.rpcUrls.default.http[0],
                  explorer: defaultChainConfig.blockExplorers?.default.url
                }}
              />
            } 
          />
          <Route 
            path="/dapps" 
            element={
              <DAppConnections 
                address={address as Address}
              />
            } 
          />
          <Route 
            path="/security" 
            element={
              <BiometricPrompt 
                onUnlock={async () => {
                  console.log('Unlocked');
                  return Promise.resolve();
                }}
              />
            } 
          />
        </Routes>
      </Router>
      <Toaster />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DAppProvider config={{
      defaultChain: mainnet.id,
      rpcUrl: mainnet.rpcUrls.default.http[0],
      autoConnect: true,
      sessionTimeout: 3600,
      maxConnections: 10,
      requireConfirmation: true,
      qrcodeModal: null,
    }}>
      <NetworkProvider>
        <TokenProvider>
          <TransactionProvider>
            <GasProvider>
              <AddressBookProvider>
                <HardwareWalletProvider>
                  <AppContent />
                </HardwareWalletProvider>
              </AddressBookProvider>
            </GasProvider>
          </TransactionProvider>
        </TokenProvider>
      </NetworkProvider>
    </DAppProvider>
  );
};

export default App; 