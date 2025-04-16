import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DAppManager } from '../../../core/dapp/DAppManager';
import { ChainConfig } from '../../../types/wallet';
import { SessionManager } from '../../../core/session/SessionManager';
import { KeyManager } from '../../../core/keyManagement/KeyManager';
import { DAppManifest } from '../../../types/dapp';
import { ErrorCorrelator } from '../../../core/error/ErrorCorrelator';
import { WalletError } from '../../../core/error/ErrorHandler';

// Mock dependencies
jest.mock('../../../core/session/SessionManager');
jest.mock('../../../core/keyManagement/KeyManager');

describe('DAppManager', () => {
  let dAppManager: DAppManager;
  let sessionManager: jest.Mocked<SessionManager>;
  let errorCorrelator: ErrorCorrelator;
  let keyManager: jest.Mocked<KeyManager>;

  const mockNetwork: ChainConfig = {
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
  };

  const mockManifest: DAppManifest = {
    id: 'test-dapp',
    name: 'Test DApp',
    description: 'A test DApp',
    url: 'https://test-dapp.com',
    icon: 'https://test-dapp.com/icon.png',
    permissions: ['read'],
    auditStatus: 'pending'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new SessionManager() as jest.Mocked<SessionManager>;
    errorCorrelator = ErrorCorrelator.getInstance();
    keyManager = new KeyManager() as jest.Mocked<KeyManager>;

    // Create DAppManager instance
    dAppManager = new DAppManager(sessionManager, errorCorrelator);
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
      const mockSession = { id: 'test-session' };
      sessionManager.createSession.mockResolvedValue(mockSession);
      keyManager.getAddress.mockReturnValue('0x123');

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