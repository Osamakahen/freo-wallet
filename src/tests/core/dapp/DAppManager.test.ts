import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DAppManager } from '../../../core/dapp/DAppManager';
import { ChainConfig } from '../../../types/wallet';
import { SessionManager } from '../../../core/session/SessionManager';
import { KeyManager } from '../../../core/keyManagement/KeyManager';
import { DAppManifest, AuditStatus, SessionPermissions } from '../../../types/dapp';
import { ErrorCorrelator } from '../../../core/error/ErrorCorrelator';
import { Session, DeviceInfo } from '../../../types/session';
import { EVMAdapter } from '../../../core/chain/EVMAdapter';

// Mock dependencies
jest.mock('../../../core/session/SessionManager');
jest.mock('../../../core/keyManagement/KeyManager');
jest.mock('../../../core/chain/EVMAdapter');

describe('DAppManager', () => {
  let dAppManager: DAppManager;
  let sessionManager: jest.Mocked<SessionManager>;
  let errorCorrelator: ErrorCorrelator;
  let keyManager: jest.Mocked<KeyManager>;
  let evmAdapter: jest.Mocked<EVMAdapter>;

  const mockChainConfig: ChainConfig = {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    symbol: 'ETH'
  };

  const mockDeviceInfo: DeviceInfo = {
    browser: 'test-browser',
    os: 'test-os',
    platform: 'test-platform',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    timezone: 'UTC',
    language: 'en'
  };

  const mockPermissions: SessionPermissions = {
    read: true,
    write: true,
    sign: true,
    nft: true
  };

  const mockManifest: DAppManifest = {
    id: 'test-dapp',
    name: 'Test DApp',
    description: 'A test DApp',
    origin: 'https://test-dapp.com',
    icon: 'https://test-dapp.com/icon.png',
    permissions: ['read'],
    chains: [1],
    version: '1.0.0',
    auditStatus: AuditStatus.PENDING
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new SessionManager() as jest.Mocked<SessionManager>;
    errorCorrelator = ErrorCorrelator.getInstance();
    keyManager = new KeyManager() as jest.Mocked<KeyManager>;
    evmAdapter = new EVMAdapter(mockChainConfig) as jest.Mocked<EVMAdapter>;

    dAppManager = new DAppManager(evmAdapter, sessionManager);
  });

  describe('DApp Registration', () => {
    it('should register a valid dApp manifest', async () => {
      await dAppManager.registerDApp(mockManifest);
      const storedData = localStorage.getItem('freo_dapp_registry');
      expect(storedData).toBeTruthy();
    });

    it('should throw error for invalid manifest', async () => {
      const invalidManifest = { ...mockManifest, id: '' };
      await expect(dAppManager.registerDApp(invalidManifest))
        .rejects
        .toThrow('Missing dApp ID');
    });
  });

  describe('DApp Connection', () => {
    beforeEach(async () => {
      await dAppManager.registerDApp(mockManifest);
    });

    it('should connect to a registered dApp', async () => {
      const mockSession: Session = {
        id: 'test-session',
        timestamp: Date.now(),
        deviceInfo: mockDeviceInfo,
        deviceChanges: [],
        permissionChanges: [],
        isActive: true,
        lastActivity: Date.now(),
        address: '0x123',
        chainId: 1,
        permissions: mockPermissions
      };
      sessionManager.createSession.mockResolvedValue(mockSession);
      keyManager.getAddress.mockResolvedValue('0x123' as `0x${string}`);

      const session = await dAppManager.connect(mockManifest.id);
      expect(session).toEqual(mockSession);
      expect(sessionManager.createSession).toHaveBeenCalledWith(mockManifest, '0x123');
    });

    it('should throw error for unregistered dApp', async () => {
      await expect(dAppManager.connect('unknown-dapp'))
        .rejects
        .toThrow('DApp not found: unknown-dapp');
    });
  });
}); 