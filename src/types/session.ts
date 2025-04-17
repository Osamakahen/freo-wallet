import { type SecurityEvent, type SecurityAlert } from './security';
import { Address } from 'viem';

export interface SessionKey {
  id: string;
  key: string;
}

export interface SessionToken {
  id: string;
  token: string;
  expiresAt: number;
}

export interface SessionState {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  error: Error | null;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  ip: string;
}

export interface SessionConfig {
  tokenDuration: number;
  refreshThreshold?: number;
  maxSessions?: number;
  deviceVerification?: boolean;
  analyticsEnabled?: boolean;
  monitoringEnabled?: boolean;
  recoveryTokenDuration?: number;
}

export interface SessionPermissions {
  read: boolean;
  write: boolean;
  sign: boolean;
  connect: boolean;
  disconnect: boolean;
}

export type Permission = 'read' | 'write' | 'admin';

export interface DAppPermissions {
  origin: string;
  permissions: Permission[];
  grantedAt: number;
  expiresAt: number;
}

export interface SessionManager {
  initializeSession: (privateKey: string, passphrase?: string) => Promise<void>;
  deriveSessionKey: () => Promise<SessionKey>;
  createSessionToken: (nonce: string, dAppOrigin: string) => Promise<SessionToken>;
  validateSessionToken: (token: SessionToken) => Promise<boolean>;
  refreshSessionToken: () => Promise<SessionToken>;
  revokeSession: (dAppOrigin?: string) => Promise<void>;
  getActiveSessions: () => Promise<DAppPermissions[]>;
  storeSessionKey: (key: SessionKey) => Promise<void>;
  retrieveSessionKey: () => Promise<SessionKey | null>;
  encryptData: (data: string) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
  trackSessionMetrics: () => Promise<SessionMetrics>;
  auditSession: (sessionId: string) => Promise<SessionAuditLog>;
  monitorActiveSessions: () => Promise<SessionStats>;
  detectAnomalies: () => Promise<SecurityAlert[]>;
  generateSessionReport: () => Promise<SessionReport>;
}

export interface Session {
  id: string;
  address: Address;
  chainId: number;
  permissions: SessionPermissions;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: DeviceInfo;
  lastActivity?: number;
}

export interface SessionMetrics {
  sessionId: string;
  duration: number;
  operations: number;
  lastActivity: number;
  deviceInfo: any;
  ipAddress: string;
  securityScore: number;
}

export interface SessionAuditLog {
  sessionId: string;
  timestamp: number;
  operations: number;
  securityEvents: SecurityEvent[];
  deviceChanges: any[];
  permissionChanges: any[];
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  averageDuration: number;
  securityAlerts: SecurityAlert[];
  permissionUsage: Map<string, number>;
}

export interface SessionReport {
  session: Session;
  metrics: SessionMetrics;
  auditLog: SessionAuditLog;
  stats: SessionStats;
  alerts: SecurityAlert[];
  recommendations: string[];
} 