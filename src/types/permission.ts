export type DAppPermission = 'read' | 'transaction' | 'message-sign' | 'assets' | 'history';

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: DAppPermission[];
  createdAt: number;
  updatedAt: number;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  permissions: DAppPermission[];
  description: string;
}

export interface PermissionChange {
  id: string;
  dAppId: string;
  oldPermissions: DAppPermission[];
  newPermissions: DAppPermission[];
  timestamp: number;
  reason: string;
}

export interface PermissionUsage {
  permission: DAppPermission;
  count: number;
  lastUsed: number;
  dApps: string[];
}

export interface PermissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: DAppPermission[];
}

export interface PermissionMetrics {
  totalGroups: number;
  totalTemplates: number;
  mostUsedPermissions: DAppPermission[];
  permissionUsage: Map<string, number>;
  recentChanges: PermissionChange[];
}

export interface PermissionRecommendation {
  dAppType: string;
  suggestedPermissions: DAppPermission[];
  confidence: number;
  reasoning: string;
}

export interface PermissionAudit {
  dAppId: string;
  changes: PermissionChange[];
  currentPermissions: DAppPermission[];
  usage: PermissionUsage[];
  validation: PermissionValidation;
} 