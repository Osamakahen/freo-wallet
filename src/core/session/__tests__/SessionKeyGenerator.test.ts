import { describe, expect, it, jest } from '@jest/globals';
import { SessionKeyGenerator } from '../SessionKeyGenerator';
import { WalletError } from '../../error/ErrorHandler';

// Mock the device fingerprint utility
jest.mock('../../../utils/device', () => ({
  getDeviceFingerprint: jest.fn().mockResolvedValue('test-fingerprint')
}));

describe('SessionKeyGenerator', () => {
  let masterKey: CryptoKey;

  beforeEach(async () => {
    // Create a mock master key
    masterKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  });

  it('should generate a valid session key', async () => {
    const sessionKey = await SessionKeyGenerator.generateSessionKey(masterKey);
    
    expect(sessionKey).toBeDefined();
    expect(sessionKey.key).toBeDefined();
    expect(sessionKey.salt).toBeDefined();
    expect(sessionKey.fingerprint).toBe('test-fingerprint');
    
    // Verify key properties
    expect(sessionKey.key.algorithm.name).toBe('AES-GCM');
    expect(sessionKey.key.type).toBe('secret');
    expect(sessionKey.key.usages).toContain('encrypt');
    expect(sessionKey.key.usages).toContain('decrypt');
  });

  it('should validate session key against device fingerprint', async () => {
    const sessionKey = await SessionKeyGenerator.generateSessionKey(masterKey);
    const isValid = await SessionKeyGenerator.validateSessionKey(
      sessionKey,
      'test-fingerprint'
    );
    
    expect(isValid).toBe(true);
  });

  it('should reject invalid device fingerprint', async () => {
    const sessionKey = await SessionKeyGenerator.generateSessionKey(masterKey);
    const isValid = await SessionKeyGenerator.validateSessionKey(
      sessionKey,
      'invalid-fingerprint'
    );
    
    expect(isValid).toBe(false);
  });
}); 