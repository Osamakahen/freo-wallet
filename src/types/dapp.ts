import { ChainId } from './chain';
import { Address } from 'viem';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { WalletConnectModalSign } from '@walletconnect/modal-sign-html';

export type DAppPermission = 'read' | 'transaction' | 'message-sign' | 'assets' | 'history';

export interface DAppManifest {
  id: string;
  name: string;
  description: string;
  origin: string;
  icon: string;
  permissions: DAppPermission[];
  chains: ChainId[];
  version: string;
  auditStatus: AuditStatus;
}

export enum AuditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface DAppSession {
  dappId: string;
  address: string;
  permissions: DAppPermission[];
  expiresAt: number;
  deviceFingerprint: string;
  timestamp: number;
}

export interface DAppMetadata {
  name: string;
  icon: string;
  description: string;
  version: string;
}

export interface DAppBridge {
  isConnected: () => boolean;
  requestAccounts: () => Promise<string[]>;
  requestPermissions: (permissions: Permission[]) => Promise<Permission[]>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (transaction: TransactionRequest) => Promise<string>;
  onAccountsChanged: (callback: (accounts: string[]) => void) => void;
  onChainChanged: (callback: (chainId: string) => void) => void;
  onDisconnect: (callback: () => void) => void;
}

export interface SessionPermissions {
  read: boolean;
  write: boolean;
  sign: boolean;
  nft: boolean;
}

export interface DAppInfo {
  name: string;
  icon: string;
  origin: string;
  description: string;
  permissions: SessionPermissions;
}

export interface BridgeState {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  permissions: SessionPermissions | null;
  error: string | null;
}

export interface BridgeEvents {
  connect: () => void;
  disconnect: () => void;
  accountsChanged: (accounts: Address[]) => void;
  chainChanged: (chainId: number) => void;
  message: (message: string) => void;
}

export interface BridgeConfig {
  autoConnect: boolean;
  sessionTimeout: number;
  maxConnections: number;
  requireConfirmation: boolean;
  rpcUrl: string;
  qrcodeModal: any; // This is from @walletconnect/qrcode-modal
  defaultChain?: number;
}

export interface TransactionRequest {
  from: Address;
  to: Address;
  value: string;
  data?: string;
  nonce?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit?: string;
}

export interface Permission {
  type: 'read' | 'write' | 'transaction' | 'message-sign' | 'nft-access';
  description: string;
}

export interface DAppRequest {
  method: string;
  params: unknown[];
  id: number;
}

export interface DAppResponse {
  result: unknown;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

export interface DAppMessage {
  type: string;
  data?: unknown;
}

export interface DAppConnector {
  qrcodeModal: typeof QRCodeModal;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (request: DAppRequest) => Promise<DAppResponse>;
  on: (event: string, callback: (data: DAppMessage) => void) => void;
  off: (event: string, callback: (data: DAppMessage) => void) => void;
} 