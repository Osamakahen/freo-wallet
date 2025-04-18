export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  timestamp: number;
}

export interface SecurityError {
  code: string;
  message: string;
  details?: {
    timestamp: number;
    deviceInfo?: {
      browser: string;
      os: string;
      platform: string;
    };
    location?: {
      ip: string;
      country?: string;
      city?: string;
    };
    action?: string;
    context?: Record<string, string>;
  };
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'transaction' | 'permission_change' | 'device_change';
  timestamp: number;
  success: boolean;
  error?: SecurityError;
  metadata?: Record<string, string>;
}

export interface SecurityScore {
  score: number;
  factors: {
    deviceChanges: number;
    securityEvents: number;
    rateLimitViolations: number;
  };
  recommendations: string[];
}

export interface SecurityAlert {
  type: string;
  sessionId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
  details?: {
    deviceInfo?: DeviceInfo;
    location?: {
      ip: string;
      country?: string;
      city?: string;
    };
    action?: string;
    context?: Record<string, string>;
  };
}

export interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  requireBiometric: boolean;
  allowedOrigins: string[];
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  averageSecurityScore: number;
  deviceChanges: number;
  rateLimitViolations: number;
}

export interface SecurityReport {
  metrics: SecurityMetrics;
  recentAlerts: SecurityAlert[];
  deviceHistory: DeviceInfo[];
  securityEvents: SecurityEvent[];
  recommendations: string[];
} 