import { Permission } from '../../types/permission';
import { WalletError } from '../error/ErrorHandler';
import { ErrorCorrelator } from '../error/ErrorCorrelator';
import { AnalyticsService } from '../../services/AnalyticsService';
import { AnalyticsEvent } from '../../types/analytics';

export class EnhancedPermissionManager {
  private permissions: Map<string, DAppPermission[]> = new Map();
  private permissionGroups: Map<string, PermissionGroup> = new Map();
  private permissionTemplates: Map<string, PermissionTemplate> = new Map();
  private permissionHistory: PermissionChange[] = [];
  private permissionUsage: Map<string, number> = new Map();
  private analyticsService: AnalyticsService;
  private errorCorrelator: ErrorCorrelator;

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
    this.errorCorrelator = ErrorCorrelator.getInstance();
    this.initializeDefaultTemplates();
  }

  public async createPermissionGroup(name: string, permissions: DAppPermission[]): Promise<void> {
    try {
      const group: PermissionGroup = {
        id: this.generateId(),
        name,
        permissions,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.permissionGroups.set(group.id, group);
      await this.analyticsService.trackEvent({
        type: 'permission_group',
        name: 'permission_group_created',
        timestamp: Date.now(),
        group
      });
    } catch (error) {
      const walletError = new WalletError(
        `Failed to create permission group: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async applyPermissionTemplate(templateId: string): Promise<DAppPermission[]> {
    try {
      const template = this.permissionTemplates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      await this.analyticsService.trackEvent({
        type: 'permission_template',
        name: 'permission_template_applied',
        timestamp: Date.now(),
        templateId
      });
      return template.permissions;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to apply permission template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async inheritPermissions(parentDApp: string): Promise<DAppPermission[]> {
    try {
      const parentPermissions = this.getDAppPermissions(parentDApp);
      if (!parentPermissions) {
        throw new Error(`Parent dApp ${parentDApp} not found`);
      }

      await this.analyticsService.trackEvent({
        type: 'permission_inheritance',
        name: 'permissions_inherited',
        timestamp: Date.now(),
        parentDApp
      });
      return parentPermissions;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to inherit permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async trackPermissionUsage(): Promise<Map<string, number>> {
    try {
      const usage = new Map<string, number>();
      
      for (const [permission, count] of this.permissionUsage) {
        usage.set(permission, count);
        await this.analyticsService.trackEvent({
          type: 'permission_usage',
          name: 'permission_usage_tracked',
          timestamp: Date.now(),
          permission,
          count
        });
      }

      return usage;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to track permission usage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async suggestPermissions(dAppType: string): Promise<DAppPermission[]> {
    try {
      const suggestions = this.getSuggestedPermissions(dAppType);
      await this.analyticsService.trackEvent({
        type: 'permission_suggestion',
        name: 'permissions_suggested',
        timestamp: Date.now(),
        dAppType,
        suggestions
      });
      return suggestions;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to suggest permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async validatePermissions(permissions: DAppPermission[]): Promise<boolean> {
    try {
      const valid = this.arePermissionsValid(permissions);
      await this.analyticsService.trackEvent({
        type: 'permission_validation',
        name: 'permissions_validated',
        timestamp: Date.now(),
        permissions,
        valid
      });
      return valid;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to validate permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async getPermissionMetrics(): Promise<PermissionMetrics> {
    try {
      const metrics: PermissionMetrics = {
        totalGroups: this.permissionGroups.size,
        totalTemplates: this.permissionTemplates.size,
        mostUsedPermissions: this.getMostUsedPermissions(),
        permissionUsage: this.permissionUsage,
        recentChanges: this.getRecentPermissionChanges()
      };

      await this.analyticsService.trackEvent({
        type: 'permission_metrics',
        name: 'permission_metrics_retrieved',
        timestamp: Date.now(),
        metrics
      });
      return metrics;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to get permission metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async requestPermissions(
    dAppId: string,
    dAppType: string,
    permissions: DAppPermission[]
  ): Promise<DAppPermission[]> {
    try {
      // Log the permission request for audit purposes
      console.log(`Permission request from dApp: ${dAppId} (${dAppType})`);
      console.log('Requested permissions:', permissions);
      
      const event: AnalyticsEvent = {
        type: 'permission_request',
        name: 'dapp_permission_request',
        timestamp: Date.now(),
        dAppId,
        dAppType,
        permissions
      };
      
      await this.analyticsService.trackEvent(event);
      
      // Store the permissions for this dApp
      this.permissions.set(dAppId, permissions);
      
      return permissions;
    } catch (error) {
      const walletError = new WalletError(
        `Failed to request permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async checkPermission(dAppType: string): Promise<boolean> {
    try {
      // Check if the dApp type has any restrictions
      const restrictedTypes = ['high_risk', 'unverified'];
      return !restrictedTypes.includes(dAppType);
    } catch (error) {
      const walletError = new WalletError(
        `Failed to check permission: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  public async revokePermissions(
    dAppId: string,
    dAppType: string,
    permissions: DAppPermission[]
  ): Promise<void> {
    try {
      // Log the permission revocation for audit purposes
      console.log(`Permission revocation from dApp: ${dAppId} (${dAppType})`);
      console.log('Revoked permissions:', permissions);
      
      const event: AnalyticsEvent = {
        type: 'permission_revocation',
        name: 'dapp_permission_revocation',
        timestamp: Date.now(),
        dAppId,
        dAppType,
        permissions
      };
      
      await this.analyticsService.trackEvent(event);
      
      // Remove the permissions for this dApp
      this.permissions.delete(dAppId);
      
      // Track the revocation in permission history
      this.permissionHistory.push({
        id: this.generateId(),
        dAppId,
        oldPermissions: permissions,
        newPermissions: [],
        timestamp: Date.now(),
        reason: 'User revoked permissions'
      });
    } catch (error) {
      const walletError = new WalletError(
        `Failed to revoke permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      await this.errorCorrelator.correlateError(walletError);
      throw walletError;
    }
  }

  private initializeDefaultTemplates(): void {
    // Initialize default permission templates
    const defaultTemplates: PermissionTemplate[] = [
      {
        id: 'basic',
        name: 'Basic Access',
        description: 'Basic wallet access permissions',
        permissions: ['read']
      },
      {
        id: 'full',
        name: 'Full Access',
        description: 'Full wallet access permissions',
        permissions: ['read', 'transaction', 'message-sign', 'assets', 'history']
      }
    ];

    defaultTemplates.forEach(template => {
      this.permissionTemplates.set(template.id, template);
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getDAppPermissions(dAppId: string): DAppPermission[] | null {
    return this.permissions.get(dAppId) || null;
  }

  private getSuggestedPermissions(dAppType: string): DAppPermission[] {
    const defaultPermissions: DAppPermission[] = ['read'];
    const typeBasedPermissions: Record<string, DAppPermission[]> = {
      'defi': ['read', 'transaction', 'assets'],
      'nft': ['read', 'assets'],
      'social': ['read', 'message-sign'],
      'gaming': ['read', 'transaction', 'assets']
    };

    return typeBasedPermissions[dAppType] || defaultPermissions;
  }

  private arePermissionsValid(permissions: DAppPermission[]): boolean {
    const validPermissions: DAppPermission[] = [
      'read',
      'transaction',
      'message-sign',
      'assets',
      'history'
    ];

    return permissions.every(permission => validPermissions.includes(permission));
  }

  private getMostUsedPermissions(): DAppPermission[] {
    const sorted = Array.from(this.permissionUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([permission]) => permission as DAppPermission);
    return sorted.slice(0, 5);
  }

  private getRecentPermissionChanges(): PermissionChange[] {
    return this.permissionHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }
} 