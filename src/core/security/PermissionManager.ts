import { Permission } from '../../types/dapp';
import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';

export class PermissionManager {
  private static instance: PermissionManager | null = null;
  private permissions: Map<string, Permission[]> = new Map();
  private errorCorrelator: ErrorCorrelator;

  private constructor() {
    this.errorCorrelator = ErrorCorrelator.getInstance();
  }

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  async grantPermissions(address: string, permissions: Permission[]): Promise<void> {
    try {
      this.permissions.set(address, permissions);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to grant permissions', 'PERMISSION_GRANT_ERROR', { error })
      );
      throw error;
    }
  }

  async revokePermissions(address: string): Promise<void> {
    try {
      this.permissions.delete(address);
    } catch (error) {
      await this.errorCorrelator.correlateError(
        new WalletError('Failed to revoke permissions', 'PERMISSION_REVOKE_ERROR', { error })
      );
      throw error;
    }
  }

  async getPermissions(address: string): Promise<Permission[]> {
    return this.permissions.get(address) || [];
  }

  async hasPermission(address: string, permissionType: string): Promise<boolean> {
    const permissions = await this.getPermissions(address);
    return permissions.some(p => p.type === permissionType);
  }
} 