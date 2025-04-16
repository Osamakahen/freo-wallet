export interface SDKConfig {
  apiKey: string;
  network: string;
  debug?: boolean;
}

export interface Session {
  id: string;
  address: string;
  chainId: number;
  network: string;
  permissions: string[];
  timestamp: number;
  createdAt: number;
  expiresAt: number;
}

export interface Event {
  type: string;
  data: unknown;
  timestamp: number;
}

export interface Analytics {
  event: string;
  data: unknown;
  timestamp: number;
  sessionId: string;
}

export type EventHandler = (event: Event) => void;

export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SDKError';
  }
} 