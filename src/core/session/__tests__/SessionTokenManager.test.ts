import { SessionTokenManager } from '../SessionTokenManager';
import { getDeviceFingerprint } from '../../../utils/device';

// Mock the device fingerprint utility
jest.mock('../../../utils/device', () => ({
  getDeviceFingerprint: jest.fn().mockResolvedValue('test-fingerprint')
}));

describe('SessionTokenManager', () => {
  const secretKey = new Uint8Array(32);
  const payload = {
    sub: 'test-user',
    aud: 'https://test-dapp.com',
    device: 'test-fingerprint',
    sid: 'test-session-id'
  };

  it('should generate a valid token', async () => {
    const token = await SessionTokenManager.generateToken(payload, secretKey);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token', async () => {
    const token = await SessionTokenManager.generateToken(payload, secretKey);
    const verified = await SessionTokenManager.verifyToken(token, secretKey);
    
    expect(verified).toBeDefined();
    expect(verified.sub).toBe(payload.sub);
    expect(verified.aud).toBe(payload.aud);
    expect(verified.device).toBe(payload.device);
    expect(verified.sid).toBe(payload.sid);
    expect(verified.iat).toBeDefined();
    expect(verified.exp).toBeDefined();
  });

  it('should reject an invalid token', async () => {
    const invalidToken = 'invalid.token.here';
    
    await expect(
      SessionTokenManager.verifyToken(invalidToken, secretKey)
    ).rejects.toThrow();
  });

  it('should detect when a token needs refresh', async () => {
    const token = await SessionTokenManager.generateToken(payload, secretKey);
    const needsRefresh = await SessionTokenManager.needsRefresh(token);
    
    expect(needsRefresh).toBe(false);
  });

  it('should validate token against device fingerprint', async () => {
    const token = await SessionTokenManager.generateToken(payload, secretKey);
    const isValid = await SessionTokenManager.validateToken(token, secretKey);
    
    expect(isValid).toBe(true);
  });

  it('should reject token from different device', async () => {
    const token = await SessionTokenManager.generateToken(payload, secretKey);
    jest.mocked(getDeviceFingerprint).mockResolvedValueOnce('different-fingerprint');
    
    const isValid = await SessionTokenManager.validateToken(token, secretKey);
    expect(isValid).toBe(false);
  });
}); 