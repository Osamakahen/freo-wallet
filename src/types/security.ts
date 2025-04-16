export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
  timestamp: number;
}

export interface SecurityEvent {
  type: 'SUSPICIOUS_ACTIVITY' | 'MULTIPLE_DEVICES' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN' | 'DEVICE_MISMATCH';
  timestamp: number;
  details: string;
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
  details?: any;
}

export interface SecurityConfig {
  rateLimitWindow: number;
  maxRequests: number;
  securityScoreThreshold: number;
  deviceChangeLimit: number;
  sessionTimeout: number;
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