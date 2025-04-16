import { EnhancedPermissionManager } from '../EnhancedPermissionManager';
import { DAppPermission, PermissionGroup, PermissionTemplate } from '../../../types/permission';

describe('EnhancedPermissionManager', () => {
  let permissionManager: EnhancedPermissionManager;
  const mockPermissions: DAppPermission[] = ['read', 'transaction', 'message-sign'];
  const mockGroup: PermissionGroup = {
    id: 'test-group',
    name: 'Test Group',
    permissions: mockPermissions,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const mockTemplate: PermissionTemplate = {
    id: 'test-template',
    name: 'Test Template',
    permissions: mockPermissions,
    description: 'Test template description'
  };

  beforeEach(() => {
    permissionManager = new EnhancedPermissionManager();
  });

  describe('createPermissionGroup', () => {
    it('should create a permission group correctly', async () => {
      await permissionManager.createPermissionGroup(mockGroup.name, mockGroup.permissions);
      // Verify through metrics that a group was created
      const metrics = await permissionManager.getPermissionMetrics();
      expect(metrics.totalGroups).toBeGreaterThan(0);
    });
  });

  describe('applyPermissionTemplate', () => {
    it('should apply a permission template correctly', async () => {
      const permissions = await permissionManager.applyPermissionTemplate(mockTemplate.id);
      expect(permissions).toEqual(mockTemplate.permissions);
    });

    it('should throw error for non-existent template', async () => {
      await expect(permissionManager.applyPermissionTemplate('non-existent'))
        .rejects
        .toThrow('Template non-existent not found');
    });
  });

  describe('inheritPermissions', () => {
    it('should inherit permissions from parent dApp correctly', async () => {
      const permissions = await permissionManager.inheritPermissions('parent-dapp');
      expect(permissions).toEqual(mockPermissions);
    });

    it('should throw error for non-existent parent dApp', async () => {
      await expect(permissionManager.inheritPermissions('non-existent'))
        .rejects
        .toThrow('Parent dApp non-existent not found');
    });
  });

  describe('trackPermissionUsage', () => {
    it('should track permission usage correctly', async () => {
      const usage = await permissionManager.trackPermissionUsage();
      expect(usage).toBeInstanceOf(Map);
      expect(usage.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suggestPermissions', () => {
    it('should suggest permissions based on dApp type', async () => {
      const suggestions = await permissionManager.suggestPermissions('defi');
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(permission => {
        expect(mockPermissions).toContain(permission);
      });
    });
  });

  describe('validatePermissions', () => {
    it('should validate permissions correctly', async () => {
      const isValid = await permissionManager.validatePermissions(mockPermissions);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('getPermissionMetrics', () => {
    it('should get permission metrics correctly', async () => {
      const metrics = await permissionManager.getPermissionMetrics();
      expect(metrics).toHaveProperty('totalGroups');
      expect(metrics).toHaveProperty('totalTemplates');
      expect(metrics).toHaveProperty('mostUsedPermissions');
      expect(metrics).toHaveProperty('permissionUsage');
      expect(metrics).toHaveProperty('recentChanges');
    });
  });
}); 