import { SignClient } from '@walletconnect/sign-client';
import { SessionTypes } from '@walletconnect/types';
import { WalletConnectModal } from '@walletconnect/modal';
import { NetworkManager } from '../network/NetworkManager';
import { WalletError } from '../error/ErrorHandler';

export class WalletConnectBridge {
  private signClient: InstanceType<typeof SignClient> | null = null;
  private web3Modal: WalletConnectModal | null = null;
  private session: SessionTypes.Struct | null = null;

  constructor(private networkManager: NetworkManager) {}

  async initialize() {
    try {
      const client = await SignClient.init({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        metadata: {
          name: 'Freo Wallet',
          description: 'A secure and user-friendly Ethereum wallet',
          url: 'https://freo-wallet.vercel.app',
          icons: ['https://freo-wallet.vercel.app/logo.png']
        }
      });

      this.signClient = client;

      this.web3Modal = new WalletConnectModal({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        themeMode: 'dark',
        chains: [`eip155:${this.networkManager.getCurrentNetwork().chainId}`]
      });

      // Handle session events
      if (this.signClient) {
        this.signClient.on('session_event', (event: { params: { event: { name: string; data: any } } }) => {
          console.log('Session event:', event);
        });

        this.signClient.on('session_delete', () => {
          this.session = null;
        });
      }
    } catch (error) {
      throw new WalletError('Failed to initialize WalletConnect', 'WALLETCONNECT_INIT_ERROR', { error });
    }
  }

  async connect() {
    if (!this.signClient) {
      throw new WalletError('WalletConnect not initialized', 'WALLETCONNECT_NOT_INITIALIZED');
    }

    try {
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign'],
            chains: [`eip155:${this.networkManager.getCurrentNetwork().chainId}`],
            events: ['chainChanged', 'accountsChanged']
          }
        }
      });

      if (uri) {
        this.web3Modal?.openModal({ uri });
      }

      this.session = await approval();
      this.web3Modal?.closeModal();

      return this.session;
    } catch (error) {
      throw new WalletError('Failed to connect with WalletConnect', 'WALLETCONNECT_CONNECT_ERROR', { error });
    }
  }

  async disconnect() {
    if (!this.signClient || !this.session) {
      throw new WalletError('No active WalletConnect session', 'WALLETCONNECT_NO_SESSION');
    }

    try {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: {
          code: 6000,
          message: 'User disconnected'
        }
      });
      this.session = null;
    } catch (error) {
      throw new WalletError('Failed to disconnect WalletConnect', 'WALLETCONNECT_DISCONNECT_ERROR', { error });
    }
  }

  getSession(): SessionTypes.Struct | null {
    return this.session;
  }

  isConnected(): boolean {
    return !!this.session;
  }
} 