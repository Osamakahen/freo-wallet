import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionKeyManager } from '../SessionKeyManager';
import { SessionToken } from '../../../types/session';

describe('SessionKeyManager', () => {
  let sessionKeyManager: SessionKeyManager;
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const mockDeviceFingerprint = 'device123';

  beforeEach(() => {
    vi.stubEnv('SESSION_SECRET_KEY', 'test-secret-key');
    sessionKeyManager = new SessionKeyManager();
  });

  describe('generateSessionKey', () => {
    it('should generate a valid session key', async () => {
      const sessionKey = await sessionKeyManager.generateSessionKey(mockAddress);

      expect(sessionKey).toBeDefined();
      expect(sessionKey.key).toHaveLength(64); // SHA-256 hash length
      expect(sessionKey.salt).toHaveLength(32); // 16 bytes in hex
      expect(sessionKey.token).toBeDefined();
      expect(sessionKey.createdAt).toBeLessThanOrEqual(Date.now());
      expect(sessionKey.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate different keys for the same address', async () => {
      const key1 = await sessionKeyManager.generateSessionKey(mockAddress);
      const key2 = await sessionKeyManager.generateSessionKey(mockAddress);

      expect(key1.key).not.toBe(key2.key);
      expect(key1.salt).not.toBe(key2.salt);
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a valid session token', async () => {
      const sessionKey = await sessionKeyManager.generateSessionKey(mockAddress);
      const token = await sessionKeyManager.generateSessionToken(
        sessionKey.key,
        mockAddress,
        mockDeviceFingerprint,
        3600000 // 1 hour
      );

      expect(token).toBeDefined();
      expect(token.id).toHaveLength(64);
      expect(token.payload).toBeDefined();
      expect(token.signature).toBeDefined();
      expect(token.payload.sub).toBe(mockAddress);
      expect(token.payload.device).toBe(mockDeviceFingerprint);
    });
  });

  describe('verifySessionToken', () => {
    it('should verify a valid token', async () => {
      const sessionKey = await sessionKeyManager.generateSessionKey(mockAddress);
      const token = await sessionKeyManager.generateSessionToken(
        sessionKey.key,
        mockAddress,
        mockDeviceFingerprint,
        3600000
      );

      const isValid = await sessionKeyManager.verifySessionToken(
        token,
        sessionKey.key,
        mockDeviceFingerprint
      );

      expect(isValid).toBe(true);
    });

    it('should reject token with invalid device fingerprint', async () => {
      const sessionKey = await sessionKeyManager.generateSessionKey(mockAddress);
      const token = await sessionKeyManager.generateSessionToken(
        sessionKey.key,
        mockAddress,
        mockDeviceFingerprint,
        3600000
      );

      await expect(
        sessionKeyManager.verifySessionToken(
          token,
          sessionKey.key,
          'different-fingerprint'
        )
      ).rejects.toThrow('Invalid device fingerprint');
    });

    it('should reject expired token', async () => {
      const sessionKey = await sessionKeyManager.generateSessionKey(mockAddress);
      const token = await sessionKeyManager.generateSessionToken(
        sessionKey.key,
        mockAddress,
        mockDeviceFingerprint,
        -1000 // Expired token
      );

      await expect(
        sessionKeyManager.verifySessionToken(
          token,
          sessionKey.key,
          mockDeviceFingerprint
        )
      ).rejects.toThrow('Token expired');
    });

    it('should reject invalid token', async () => {
      const invalidToken: SessionToken = {
        id: 'invalid',
        payload: {
          sub: mockAddress,
          device: mockDeviceFingerprint,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        },
        signature: 'invalid.signature'
      };

      await expect(
        sessionKeyManager.verifySessionToken(
          invalidToken,
          'invalid-key',
          mockDeviceFingerprint
        )
      ).rejects.toThrow('Invalid session token');
    });
  });
}); 