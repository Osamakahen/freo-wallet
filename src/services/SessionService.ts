import { WalletManager } from '../core/wallet/WalletManager';
import { EthereumProvider } from '../types/ethereum';
import { StorageService } from '@/services/StorageService';

export interface DAppPermissions {
  [key: string]: boolean;
}

export interface DAppSession {
  origin: string;
  address: string;
  chainId: string;
  timestamp: number;
  permissions: DAppPermissions;
  autoConnect: boolean;
  lastConnected: number;
}

export interface SessionState {
  activeSessions: Record<string, DAppSession>;
  lastActiveTimestamp: number;
  networkPreferences: Record<string, string>;
}

export interface Session {
  domain: string;
  chainId: string;
  name: string;
  favicon: string;
  connectedAt: number;
  expiresAt: number;
  lastActivity: number;
}

export class SessionService {
  private static instance: SessionService;
  private storage: StorageService;
  private walletManager: WalletManager;
  private sessionState: SessionState;
  static SESSION_STORAGE_KEY = "freo_wallet_sessions";
  static DEFAULT_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {
    this.storage = StorageService.getInstance();
    this.walletManager = new WalletManager();
    this.sessionState = {
      activeSessions: {},
      lastActiveTimestamp: Date.now(),
      networkPreferences: {}
    };
    this.initialize();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private async initialize() {
    const savedState = await this.storage.get('sessionState');
    if (savedState) {
      this.sessionState = savedState;
    }
  }

  public async createSession(
    origin: string,
    address: string,
    chainId: string,
    permissions: DAppPermissions = {},
    autoConnect: boolean = true
  ): Promise<DAppSession> {
    const session: DAppSession = {
      origin,
      address,
      chainId,
      timestamp: Date.now(),
      permissions,
      autoConnect,
      lastConnected: Date.now()
    };

    this.sessionState.activeSessions[origin] = session;
    this.sessionState.lastActiveTimestamp = Date.now();
    await this.saveState();

    return session;
  }

  public async removeSession(origin: string): Promise<void> {
    if (this.sessionState.activeSessions[origin]) {
      delete this.sessionState.activeSessions[origin];
      await this.saveState();
    }
  }

  public getSession(origin: string): DAppSession | null {
    return this.sessionState.activeSessions[origin] || null;
  }

  public getAllSessions(): Record<string, DAppSession> {
    return { ...this.sessionState.activeSessions };
  }

  public async setAutoConnect(origin: string, autoConnect: boolean): Promise<void> {
    if (this.sessionState.activeSessions[origin]) {
      this.sessionState.activeSessions[origin].autoConnect = autoConnect;
      await this.saveState();
    }
  }

  public async updateNetwork(origin: string, chainId: string): Promise<void> {
    if (this.sessionState.activeSessions[origin]) {
      this.sessionState.activeSessions[origin].chainId = chainId;
      this.sessionState.activeSessions[origin].lastConnected = Date.now();
      await this.saveState();
    }
  }

  public async setNetworkPreference(chainId: string, network: string): Promise<void> {
    this.sessionState.networkPreferences[chainId] = network;
    await this.saveState();
  }

  public getNetworkPreference(chainId: string): string | null {
    return this.sessionState.networkPreferences[chainId] || null;
  }

  public async clearAllSessions(): Promise<void> {
    this.sessionState.activeSessions = {};
    this.sessionState.networkPreferences = {};
    await this.saveState();
  }

  public isSessionValid(origin: string): boolean {
    const session = this.getSession(origin);
    if (!session) return false;

    // Check if session is expired (24 hours)
    const SESSION_EXPIRY = 24 * 60 * 60 * 1000;
    return Date.now() - session.timestamp < SESSION_EXPIRY;
  }

  public shouldAutoConnect(origin: string): boolean {
    const session = this.getSession(origin);
    return !!(session && session.autoConnect && this.isSessionValid(origin));
  }

  private async saveState(): Promise<void> {
    await this.storage.set('sessionState', this.sessionState);
  }

  public async handleAutoConnect(origin: string, provider: EthereumProvider): Promise<boolean> {
    if (!this.shouldAutoConnect(origin)) {
      return false;
    }

    const session = this.getSession(origin);
    if (!session) return false;

    try {
      // Attempt to connect with the saved session
      await this.walletManager.connect();
      const currentAddress = await this.walletManager.getAddress();
      
      if (currentAddress.toLowerCase() === session.address.toLowerCase()) {
        // Set the preferred network
        const preferredNetwork = this.getNetworkPreference(session.chainId);
        if (preferredNetwork) {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: preferredNetwork }]
          });
        }
        return true;
      }
    } catch (error) {
      console.error('Auto-connect failed:', error);
      return false;
    }

    return false;
  }

  static async initializeSession(account: string, domain: string, chainId: string): Promise<Session> {
    const sessions = await this.getActiveSessions(account);
    
    const existingSessionIndex = sessions.findIndex(
      session => session.domain === domain
    );
    
    const currentTime = Date.now();
    const expiryTime = currentTime + this.DEFAULT_EXPIRY_TIME;
    
    const newSession: Session = {
      domain,
      chainId,
      name: document.title || domain,
      favicon: this.getFavicon(),
      connectedAt: currentTime,
      expiresAt: expiryTime,
      lastActivity: currentTime
    };
    
    if (existingSessionIndex >= 0) {
      // Update existing session
      sessions[existingSessionIndex] = newSession;
    } else {
      // Add new session
      sessions.push(newSession);
    }
    
    await this.saveSessions(account, sessions);
    return newSession;
  }
  
  static async getActiveSessions(account: string): Promise<Session[]> {
    const allSessions = await this.getAllSessions();
    const accountSessions = allSessions[account] || [];
    
    // Filter out expired sessions
    const currentTime = Date.now();
    const activeSessions = accountSessions.filter(
      session => session.expiresAt > currentTime
    );
    
    // If expired sessions were filtered out, save the updated list
    if (activeSessions.length !== accountSessions.length) {
      await this.saveSessions(account, activeSessions);
    }
    
    return activeSessions;
  }
  
  static async terminateSession(account: string, domain: string): Promise<void> {
    const sessions = await this.getActiveSessions(account);
    const updatedSessions = sessions.filter(
      session => session.domain !== domain
    );
    await this.saveSessions(account, updatedSessions);
  }
  
  static async terminateAllSessions(account: string): Promise<void> {
    await this.saveSessions(account, []);
  }
  
  static async updateSessionActivity(account: string, domain: string): Promise<void> {
    const sessions = await this.getActiveSessions(account);
    const sessionIndex = sessions.findIndex(s => s.domain === domain);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].lastActivity = Date.now();
      await this.saveSessions(account, sessions);
    }
  }
  
  static async getAllSessions(): Promise<Record<string, Session[]>> {
    try {
      const data = localStorage.getItem(this.SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error loading sessions", error);
      return {};
    }
  }
  
  static async saveSessions(account: string, sessions: Session[]): Promise<void> {
    try {
      const allSessions = await this.getAllSessions();
      allSessions[account] = sessions;
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(allSessions));
    } catch (error) {
      console.error("Error saving sessions", error);
    }
  }
  
  static getFavicon(): string {
    const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
    if (links.length) {
      return links[links.length - 1].href;
    }
    return '/favicon.ico';
  }
} 