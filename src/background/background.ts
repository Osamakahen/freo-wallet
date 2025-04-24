import { SessionService } from '@/services/SessionService';
import { CHAINS } from '@/config/networks';
import { DAppSession } from '@/services/SessionService';

// Types for background script
interface BackgroundMessage {
  target: string;
  request: {
    method: string;
    params?: any[];
  };
  origin: string;
}

interface ConnectionStatus {
  connected: boolean;
  autoConnect: boolean;
  address: string | null;
  chainId: string | null;
}

interface TabMessage {
  target: string;
  type: string;
  data: any;
}

// Keep track of active connections
const activeConnections: Record<string, string> = {};
let currentAccount: string | null = null;

// Initialize from storage
chrome.storage.local.get(['freoActiveAccount'], (result) => {
  if (result.freoActiveAccount) {
    currentAccount = result.freoActiveAccount;
  }
});

// Listen for messages from injected provider or popup
chrome.runtime.onMessage.addListener((
  message: BackgroundMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  if (message.target !== 'freo-background') {
    return false;
  }

  const origin = message.origin || (sender.tab ? new URL(sender.tab.url!).origin : null);
  if (!origin) {
    sendResponse({ error: 'Origin not specified' });
    return false;
  }

  // Handle request based on method
  handleRequest(message.request, origin)
    .then(result => sendResponse({ result }))
    .catch(error => sendResponse({ error: error.message }));
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

// Process EIP-1193 requests
async function handleRequest(request: BackgroundMessage['request'], origin: string): Promise<any> {
  const { method, params = [] } = request;

  switch (method) {
    case 'eth_requestAccounts':
    case 'eth_accounts':
      return handleAccountsRequest(origin);

    case 'eth_chainId':
      return handleChainIdRequest(origin);

    case 'wallet_switchEthereumChain':
      return handleSwitchChain(origin, params);

    case 'wallet_addEthereumChain':
      return handleAddChain(params);

    case 'eth_signTransaction':
    case 'eth_sendTransaction':
    case 'eth_sign':
    case 'personal_sign':
    case 'eth_signTypedData_v4':
      return openPopupForConfirmation(method, params, origin);

    case 'freo_disconnectSession':
      return handleDisconnect(origin);

    case 'freo_getConnectionStatus':
      return handleGetConnectionStatus(origin);

    default:
      return handleGenericRequest(method, params, origin);
  }
}

// Handle accounts request with session persistence
async function handleAccountsRequest(origin: string): Promise<string[]> {
  const sessionService = SessionService.getInstance();
  const session = sessionService.getSession(origin);
  
  if (session && sessionService.shouldAutoConnect(origin)) {
    // Use existing session
    activeConnections[origin] = session.address;
    return [session.address];
  } else {
    // No session, get account from storage or prompt user
    if (!currentAccount) {
      // In real implementation, this would open the popup for user approval
      // For PoC, we'll simulate with a default account
      currentAccount = '0x0000000000000000000000000000000000000000';
      chrome.storage.local.set({ freoActiveAccount: currentAccount });
    }
    
    // Get the appropriate chain for this dApp or use default
    const chainId = session ? session.chainId : CHAINS[0].chainId.toString();
    
    // Create new session
    await sessionService.createSession(origin, currentAccount, chainId, {
      eth_accounts: true,
      eth_chainId: true,
      // Add other permissions as needed
    });
    
    activeConnections[origin] = currentAccount;
    return [currentAccount];
  }
}

// Handle chain ID request with network persistence
async function handleChainIdRequest(origin: string): Promise<string> {
  const sessionService = SessionService.getInstance();
  const session = sessionService.getSession(origin);
  if (session) {
    return session.chainId;
  }
  // Default to first network
  return CHAINS[0].chainId.toString();
}

// Handle network switching with session update
async function handleSwitchChain(origin: string, params: any[]): Promise<null> {
  const targetChainId = params[0].chainId;
  const sessionService = SessionService.getInstance();
  
  // Validate chain ID
  if (!Object.values(CHAINS).some(network => network.chainId === targetChainId)) {
    throw new Error('Unsupported chain ID');
  }
  
  // Update session with new chain
  await sessionService.updateNetwork(origin, targetChainId);
  
  // Notify all tabs on this origin
  notifyTabs(origin, 'chainChanged', targetChainId);
  
  return null; // Success response for this method is null
}

// Handle adding a new chain configuration
async function handleAddChain(params: any[]): Promise<null> {
  const chainConfig = params[0];
  // In a real implementation, store the custom chain config
  // For this PoC, just validate basic properties
  if (!chainConfig.chainId || !chainConfig.rpcUrls || !chainConfig.chainName) {
    throw new Error('Invalid chain configuration');
  }
  
  return null;
}

// Handle disconnecting a session
async function handleDisconnect(origin: string): Promise<boolean> {
  const sessionService = SessionService.getInstance();
  await sessionService.removeSession(origin);
  if (activeConnections[origin]) {
    delete activeConnections[origin];
  }
  
  // Notify tabs about disconnection
  notifyTabs(origin, 'disconnect', null);
  
  return true;
}

// Get connection status for an origin
async function handleGetConnectionStatus(origin: string): Promise<ConnectionStatus> {
  const sessionService = SessionService.getInstance();
  const session = sessionService.getSession(origin);
  return {
    connected: !!session,
    autoConnect: session ? session.autoConnect : false,
    address: session ? session.address : null,
    chainId: session ? session.chainId : null
  };
}

// Forward requests to wallet implementation
async function handleGenericRequest(method: string, params: any[], origin: string): Promise<any> {
  const sessionService = SessionService.getInstance();
  const session = sessionService.getSession(origin);
  if (!session) {
    throw new Error('Not connected');
  }
  
  // Return mock responses based on method
  if (method.startsWith('eth_call')) {
    return '0x';
  } else if (method === 'eth_blockNumber') {
    return '0x1';
  }
  
  return null;
}

// Open popup for transaction confirmation
async function openPopupForConfirmation(method: string, params: any[], origin: string): Promise<string> {
  const sessionService = SessionService.getInstance();
  const session = sessionService.getSession(origin);
  if (!session) {
    throw new Error('Not connected');
  }
  
  // Mock response based on method
  if (method.includes('sign')) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  } else if (method.includes('Transaction')) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  
  return '';
}

// Utility function to notify all tabs on a specific origin
function notifyTabs(origin: string, type: string, data: any): void {
  chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
    tabs.forEach(tab => {
      if (tab.url && tab.id) {
        const tabOrigin = new URL(tab.url).origin;
        if (tabOrigin === origin) {
          const message: TabMessage = {
            target: 'freo-content-script',
            type,
            data
          };
          chrome.tabs.sendMessage(tab.id, message);
        }
      }
    });
  });
}

// Listen for tab updates to maintain session state
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const origin = new URL(tab.url).origin;
      const sessionService = SessionService.getInstance();
      const session = sessionService.getSession(origin);
      
      if (session && sessionService.shouldAutoConnect(origin)) {
        // Tab has navigated to a site with an existing session
        // We'll send a message to initialize the provider
        const message: TabMessage = {
          target: 'freo-content-script',
          type: 'initializeProvider',
          data: {
            address: session.address,
            chainId: session.chainId
          }
        };
        chrome.tabs.sendMessage(tabId, message);
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }
}); 