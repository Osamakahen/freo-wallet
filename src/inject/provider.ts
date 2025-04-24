import { SessionService } from '@/services/SessionService';
import { EthereumProvider, EthereumEvent, EthereumCallback } from '@/types/ethereum';

interface ProviderRequest {
  method: string;
  params?: any[];
}

interface ProviderResponse {
  result?: any;
  error?: string;
}

interface ProviderMessage {
  target: string;
  request: ProviderRequest;
  origin: string;
}

interface ProviderEvent {
  type: string;
  data: any;
}

export class FreoProvider implements EthereumProvider {
  public isFreoWallet: boolean;
  public isConnected: boolean;
  public selectedAddress?: string;
  public chainId?: string;
  public connected: boolean;

  private _initialized: boolean;
  private _events: Record<string, EthereumCallback[]>;
  private sessionService: SessionService;

  constructor() {
    this.isFreoWallet = true;
    this.isConnected = false;
    this.connected = false;
    this._initialized = false;
    this._events = {};
    this.sessionService = SessionService.getInstance();

    // Initialize from saved session if available
    this._initializeFromSession();
  }

  private async _initializeFromSession(): Promise<void> {
    try {
      const origin = window.location.origin;
      const session = this.sessionService.getSession(origin);
      
      if (session && this.sessionService.shouldAutoConnect(origin)) {
        this.selectedAddress = session.address;
        this.chainId = session.chainId;
        this.connected = true;
        
        // Notify dApp about auto-connection
        this.emit('accountsChanged', [this.selectedAddress]);
        this.emit('chainChanged', this.chainId);
      }
      
      this._initialized = true;
    } catch (error) {
      console.error('Failed to initialize provider from session:', error);
    }
  }

  public on(eventName: EthereumEvent, listener: EthereumCallback): this {
    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }
    this._events[eventName].push(listener);
    return this;
  }

  public removeListener(eventName: EthereumEvent, listener: EthereumCallback): this {
    if (this._events[eventName]) {
      this._events[eventName] = this._events[eventName].filter(l => l !== listener);
    }
    return this;
  }

  public emit(eventName: EthereumEvent, data: any): void {
    if (this._events[eventName]) {
      this._events[eventName].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  public async request(args: ProviderRequest): Promise<any> {
    if (!args || typeof args !== 'object') {
      throw new Error('Invalid request args');
    }

    const { method, params = [] } = args;

    // Send request to extension background script
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          {
            target: 'freo-background',
            request: { method, params },
            origin: window.location.origin
          } as ProviderMessage,
          (response: ProviderResponse) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              // Handle specific responses
              if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                this.selectedAddress = response.result[0];
                this.connected = true;
                this.emit('accountsChanged', response.result);
              } else if (method === 'wallet_switchEthereumChain') {
                this.chainId = params[0].chainId;
                this.emit('chainChanged', this.chainId);
              }
              resolve(response.result);
            }
          }
        );
      } else {
        reject(new Error('Chrome runtime not available'));
      }
    });
  }

  // EIP-1193 required methods
  public async enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' });
  }

  public async send(method: string, params?: any[]): Promise<any> {
    return this.request({ method, params });
  }

  public async sendAsync(
    args: ProviderRequest,
    callback: (error: Error | null, result?: any) => void
  ): Promise<void> {
    try {
      const result = await this.request(args);
      callback(null, result);
    } catch (error) {
      callback(error as Error);
    }
  }
}

// Create and inject the provider
if (!window.ethereum) {
  const freoProvider = new FreoProvider();
  window.ethereum = freoProvider;
  window.dispatchEvent(new Event('ethereum#initialized'));
} else {
  // Extend existing provider if present
  (window.ethereum as any).isFreoWallet = true;
}

// Listen for messages from background script
window.addEventListener('message', async (event: MessageEvent) => {
  if (event.source !== window || !event.data || event.data.target !== 'freo-provider') {
    return;
  }
  
  const { type, data } = event.data as ProviderEvent;
  
  if (type === 'accountsChanged' && window.ethereum) {
    const provider = window.ethereum as FreoProvider;
    provider.selectedAddress = data[0];
    provider.emit('accountsChanged', data);
  } else if (type === 'chainChanged' && window.ethereum) {
    const provider = window.ethereum as FreoProvider;
    provider.chainId = data;
    provider.emit('chainChanged', data);
  } else if (type === 'disconnect' && window.ethereum) {
    const provider = window.ethereum as FreoProvider;
    provider.selectedAddress = undefined;
    provider.connected = false;
    provider.emit('disconnect', null);
  }
}); 