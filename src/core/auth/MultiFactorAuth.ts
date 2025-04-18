import { WalletError } from '../error/ErrorHandler';

export type MFAType = 'email' | 'sms' | 'authenticator';

interface MFASettings {
  enabled: boolean;
  primaryMethod: MFAType;
  backupMethod?: MFAType;
  phoneNumber?: string;
  email?: string;
}

interface MFACode {
  code: string;
  expiresAt: number;
  type: MFAType;
}

export class MultiFactorAuth {
  private static instance: MultiFactorAuth;
  private mfaSettings: Map<string, MFASettings> = new Map();
  private activeCodes: Map<string, MFACode> = new Map();
  private codeValidityDuration = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): MultiFactorAuth {
    if (!MultiFactorAuth.instance) {
      MultiFactorAuth.instance = new MultiFactorAuth();
    }
    return MultiFactorAuth.instance;
  }

  async enableMFA(userId: string, settings: Partial<MFASettings>): Promise<void> {
    const currentSettings = this.mfaSettings.get(userId) || {
      enabled: false,
      primaryMethod: 'email'
    };

    this.mfaSettings.set(userId, {
      ...currentSettings,
      ...settings,
      enabled: true
    });
  }

  async disableMFA(userId: string): Promise<void> {
    const settings = this.mfaSettings.get(userId);
    if (!settings) {
      throw new WalletError('MFA not enabled', 'MFA_NOT_ENABLED');
    }

    this.mfaSettings.set(userId, {
      ...settings,
      enabled: false
    });
  }

  async generateCode(userId: string, type: MFAType): Promise<string> {
    const settings = this.mfaSettings.get(userId);
    if (!settings?.enabled) {
      throw new WalletError('MFA not enabled', 'MFA_NOT_ENABLED');
    }

    if (type === 'email' && !settings.email) {
      throw new WalletError('Email not configured for MFA', 'EMAIL_NOT_CONFIGURED');
    }

    if (type === 'sms' && !settings.phoneNumber) {
      throw new WalletError('Phone number not configured for MFA', 'PHONE_NOT_CONFIGURED');
    }

    const code = Math.random().toString().slice(2, 8);
    const expiresAt = Date.now() + this.codeValidityDuration;

    this.activeCodes.set(`${userId}:${type}`, {
      code,
      expiresAt,
      type
    });

    try {
      await this.sendCode(userId, code, type);
      return code;
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to send MFA code',
        'MFA_SEND_ERROR',
        { error: new Error(error instanceof Error ? error.message : String(error)) }
      );
    }
  }

  private async sendCode(userId: string, code: string, type: MFAType): Promise<void> {
    const settings = this.mfaSettings.get(userId);
    if (!settings) {
      throw new WalletError('MFA settings not found', 'MFA_SETTINGS_NOT_FOUND');
    }

    switch (type) {
      case 'email':
        if (!settings.email) {
          throw new WalletError('Email not configured', 'EMAIL_NOT_CONFIGURED');
        }
        await this.sendEmailCode(settings.email, code);
        break;
      case 'sms':
        if (!settings.phoneNumber) {
          throw new WalletError('Phone number not configured', 'PHONE_NOT_CONFIGURED');
        }
        await this.sendSMSCode(settings.phoneNumber, code);
        break;
      case 'authenticator':
        // Authenticator codes are typically generated client-side
        break;
    }
  }

  private async sendEmailCode(email: string, code: string): Promise<void> {
    try {
      // TODO: Implement actual email sending logic
      await Promise.resolve();
      console.log(`Sending MFA code ${code} to ${email}`);
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to send email code',
        'EMAIL_SEND_ERROR',
        { error: new Error(error instanceof Error ? error.message : String(error)) }
      );
    }
  }

  private async sendSMSCode(phoneNumber: string, code: string): Promise<void> {
    try {
      // TODO: Implement actual SMS sending logic
      await Promise.resolve();
      console.log(`Sending MFA code ${code} to ${phoneNumber}`);
    } catch (error: unknown) {
      throw new WalletError(
        'Failed to send SMS code',
        'SMS_SEND_ERROR',
        { error: new Error(error instanceof Error ? error.message : String(error)) }
      );
    }
  }

  async verifyCode(userId: string, code: string, type: MFAType): Promise<boolean> {
    const storedCode = this.activeCodes.get(`${userId}:${type}`);
    if (!storedCode) {
      throw new WalletError('No active MFA code', 'NO_ACTIVE_CODE');
    }

    if (Date.now() > storedCode.expiresAt) {
      this.activeCodes.delete(`${userId}:${type}`);
      throw new WalletError('MFA code expired', 'CODE_EXPIRED');
    }

    const isValid = storedCode.code === code;
    if (isValid) {
      this.activeCodes.delete(`${userId}:${type}`);
    }

    return isValid;
  }

  async getMFASettings(userId: string): Promise<MFASettings | undefined> {
    return this.mfaSettings.get(userId);
  }

  async updateMFASettings(userId: string, settings: Partial<MFASettings>): Promise<void> {
    const currentSettings = this.mfaSettings.get(userId);
    if (!currentSettings) {
      throw new WalletError('MFA not enabled', 'MFA_NOT_ENABLED');
    }

    this.mfaSettings.set(userId, {
      ...currentSettings,
      ...settings
    });
  }

  async isMFAEnabled(userId: string): Promise<boolean> {
    const settings = this.mfaSettings.get(userId);
    return settings?.enabled || false;
  }

  async getActiveMFAMethods(userId: string): Promise<MFAType[]> {
    const settings = this.mfaSettings.get(userId);
    if (!settings?.enabled) return [];

    const methods: MFAType[] = [settings.primaryMethod];
    if (settings.backupMethod) {
      methods.push(settings.backupMethod);
    }
    return methods;
  }
} 