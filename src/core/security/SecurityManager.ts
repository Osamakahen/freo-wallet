import { createHash } from 'crypto';
import { DeviceInfo, SecurityEvent } from '../../types/security';

export class SecurityManager {
  private deviceHistory: Map<string, DeviceInfo[]> = new Map();
  private securityEvents: Map<string, SecurityEvent[]> = new Map();
  private rateLimits: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS = 100;

  public async getIPAddress(): Promise<string> {
    // In a real implementation, this would get the actual IP address
    return '127.0.0.1';
  }

  public async calculateSecurityScore(sessionId: string): Promise<number> {
    const events = this.securityEvents.get(sessionId) || [];
    const deviceChanges = this.deviceHistory.get(sessionId) || [];
    
    let score = 1.0;
    
    // Deduct points for security events
    events.forEach(event => {
      switch (event.type) {
        case 'transaction':
          score -= 0.1;
          break;
        case 'permission_change':
          score -= 0.2;
          break;
        case 'device_change':
          score -= 0.3;
          break;
      }
    });
    
    // Deduct points for frequent device changes
    if (deviceChanges.length > 3) {
      score -= 0.2;
    }
    
    return Math.max(0, score);
  }

  public async getSecurityEvents(sessionId: string): Promise<SecurityEvent[]> {
    return this.securityEvents.get(sessionId) || [];
  }

  public async getDeviceChanges(sessionId: string): Promise<DeviceInfo[]> {
    return this.deviceHistory.get(sessionId) || [];
  }

  public async enforceRateLimit(sessionId: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.rateLimits.get(sessionId);
    
    if (!limit) {
      this.rateLimits.set(sessionId, { count: 1, timestamp: now });
      return true;
    }
    
    if (now - limit.timestamp > this.RATE_LIMIT_WINDOW) {
      this.rateLimits.set(sessionId, { count: 1, timestamp: now });
      return true;
    }
    
    if (limit.count >= this.MAX_REQUESTS) {
      this.logSecurityEvent(sessionId, {
        type: 'transaction',
        timestamp: now,
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests in a short time period'
        }
      });
      return false;
    }
    
    this.rateLimits.set(sessionId, { count: limit.count + 1, timestamp: limit.timestamp });
    return true;
  }

  public async enhanceDeviceFingerprint(): Promise<string> {
    const deviceInfo = this.getDeviceInfo();
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(deviceInfo))
      .digest('hex');
    
    return fingerprint;
  }

  public async encryptSessionData(data: string): Promise<string> {
    // In a real implementation, this would use proper encryption
    return Buffer.from(data).toString('base64');
  }

  public async decryptSessionData(encryptedData: string): Promise<string> {
    // In a real implementation, this would use proper decryption
    return Buffer.from(encryptedData, 'base64').toString();
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now()
    };
  }

  private logSecurityEvent(sessionId: string, event: SecurityEvent): void {
    const events = this.securityEvents.get(sessionId) || [];
    events.push(event);
    this.securityEvents.set(sessionId, events);
  }

  private logDeviceChange(sessionId: string, deviceInfo: DeviceInfo): void {
    const history = this.deviceHistory.get(sessionId) || [];
    history.push(deviceInfo);
    this.deviceHistory.set(sessionId, history);
  }
} 