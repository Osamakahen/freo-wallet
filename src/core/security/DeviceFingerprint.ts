import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';

interface DeviceInfo {
  browser: {
    name: string;
    version: string;
    platform: string;
    userAgent: string;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone: string;
  language: string;
  plugins: string[];
  fonts: string[];
  canvas: string;
  webgl: string;
  audio: string;
  touchSupport: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
}

interface FingerprintData {
  id: string;
  info: DeviceInfo;
  firstSeen: number;
  lastSeen: number;
  isTrusted: boolean;
  riskScore: number;
  associatedIPs: string[];
  associatedAccounts: string[];
}

export class DeviceFingerprint {
  private static instance: DeviceFingerprint;
  private fingerprints: Map<string, FingerprintData> = new Map();
  private errorCorrelator: ErrorCorrelator;

  private constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): DeviceFingerprint {
    if (!DeviceFingerprint.instance) {
      DeviceFingerprint.instance = new DeviceFingerprint();
    }
    return DeviceFingerprint.instance;
  }

  async generateFingerprint(): Promise<string> {
    try {
      const deviceInfo = await this.collectDeviceInfo();
      const fingerprintId = await this.hashDeviceInfo(deviceInfo);
      
      const fingerprint: FingerprintData = {
        id: fingerprintId,
        info: deviceInfo,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        isTrusted: false,
        riskScore: 0,
        associatedIPs: [],
        associatedAccounts: []
      };

      this.fingerprints.set(fingerprintId, fingerprint);
      return fingerprintId;
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to generate device fingerprint', 'FINGERPRINT_GENERATION_ERROR', { error })
      );
      throw error;
    }
  }

  async validateFingerprint(fingerprintId: string): Promise<boolean> {
    try {
      const fingerprint = this.fingerprints.get(fingerprintId);
      if (!fingerprint) return false;

      const currentInfo = await this.collectDeviceInfo();
      await this.hashDeviceInfo(currentInfo); // We don't need the result, just ensure it works

      // Check if the fingerprint has changed significantly
      const similarity = this.calculateFingerprintSimilarity(fingerprint.info, currentInfo);
      return similarity > 0.8; // 80% similarity threshold
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to validate device fingerprint', 'FINGERPRINT_VALIDATION_ERROR', { fingerprintId, error })
      );
      return false;
    }
  }

  async updateFingerprint(fingerprintId: string, ip: string, accountId?: string): Promise<void> {
    try {
      const fingerprint = this.fingerprints.get(fingerprintId);
      if (!fingerprint) return;

      fingerprint.lastSeen = Date.now();
      
      if (!fingerprint.associatedIPs.includes(ip)) {
        fingerprint.associatedIPs.push(ip);
      }

      if (accountId && !fingerprint.associatedAccounts.includes(accountId)) {
        fingerprint.associatedAccounts.push(accountId);
      }

      await this.calculateRiskScore(fingerprint);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to update device fingerprint', 'FINGERPRINT_UPDATE_ERROR', { fingerprintId, error })
      );
    }
  }

  async markFingerprintAsTrusted(fingerprintId: string): Promise<void> {
    try {
      const fingerprint = this.fingerprints.get(fingerprintId);
      if (fingerprint) {
        fingerprint.isTrusted = true;
        fingerprint.riskScore = 0;
      }
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to mark fingerprint as trusted', 'FINGERPRINT_TRUST_ERROR', { fingerprintId, error })
      );
    }
  }

  async getFingerprintInfo(fingerprintId: string): Promise<FingerprintData | undefined> {
    return this.fingerprints.get(fingerprintId);
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    try {
      return {
        browser: {
          name: navigator.appName,
          version: navigator.appVersion,
          platform: navigator.platform,
          userAgent: navigator.userAgent
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        plugins: Array.from(navigator.plugins).map(p => p.name),
        fonts: await this.getInstalledFonts(),
        canvas: await this.getCanvasFingerprint(),
        webgl: await this.getWebGLFingerprint(),
        audio: await this.getAudioFingerprint(),
        touchSupport: 'ontouchstart' in window,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0
      };
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to collect device info', 'DEVICE_INFO_COLLECTION_ERROR', { error })
      );
      throw error;
    }
  }

  private async hashDeviceInfo(info: DeviceInfo): Promise<string> {
    try {
      const str = JSON.stringify(info);
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to hash device info', 'DEVICE_INFO_HASHING_ERROR', { error })
      );
      throw error;
    }
  }

  private calculateFingerprintSimilarity(info1: DeviceInfo, info2: DeviceInfo): number {
    let matches = 0;
    let total = 0;

    // Compare browser info
    if (info1.browser.name === info2.browser.name) matches++;
    if (info1.browser.platform === info2.browser.platform) matches++;
    total += 2;

    // Compare screen info
    if (Math.abs(info1.screen.width - info2.screen.width) < 100) matches++;
    if (Math.abs(info1.screen.height - info2.screen.height) < 100) matches++;
    if (info1.screen.colorDepth === info2.screen.colorDepth) matches++;
    total += 3;

    // Compare other properties
    if (info1.timezone === info2.timezone) matches++;
    if (info1.language === info2.language) matches++;
    if (info1.touchSupport === info2.touchSupport) matches++;
    if (info1.hardwareConcurrency === info2.hardwareConcurrency) matches++;
    if (info1.deviceMemory === info2.deviceMemory) matches++;
    total += 5;

    return matches / total;
  }

  private async calculateRiskScore(fingerprint: FingerprintData): Promise<void> {
    let score = 0;

    // Multiple IPs increase risk
    if (fingerprint.associatedIPs.length > 1) {
      score += fingerprint.associatedIPs.length * 10;
    }

    // Multiple accounts increase risk
    if (fingerprint.associatedAccounts.length > 1) {
      score += fingerprint.associatedAccounts.length * 15;
    }

    // Recent changes in device info increase risk
    const currentInfo = await this.collectDeviceInfo();
    const similarity = this.calculateFingerprintSimilarity(fingerprint.info, currentInfo);
    if (similarity < 0.9) {
      score += (1 - similarity) * 100;
    }

    fingerprint.riskScore = Math.min(score, 100);
  }

  private async getInstalledFonts(): Promise<string[]> {
    try {
      // This is a simplified version. In a real implementation,
      // you would use a more sophisticated font detection method
      return ['Arial', 'Times New Roman', 'Courier New'];
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to get installed fonts', 'FONT_DETECTION_ERROR', { error })
      );
      return [];
    }
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Draw some text
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Hello, world!', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Hello, world!', 4, 17);

      return canvas.toDataURL();
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to get canvas fingerprint', 'CANVAS_FINGERPRINT_ERROR', { error })
      );
      return '';
    }
  }

  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return '';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return '';

      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to get WebGL fingerprint', 'WEBGL_FINGERPRINT_ERROR', { error })
      );
      return '';
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      // This is a simplified version. In a real implementation,
      // you would use the Web Audio API to generate a more unique fingerprint
      return 'audio-fingerprint';
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to get audio fingerprint', 'AUDIO_FINGERPRINT_ERROR', { error })
      );
      return '';
    }
  }
} 