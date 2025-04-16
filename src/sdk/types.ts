export interface SDKConfig {
  apiKey: string;
  network: string;
  debug?: boolean;
}

export interface Session {
  id: string;
  address: string;
  network: string;
  timestamp: number;
}

export interface Event {
  type: string;
  data: unknown;
  timestamp: number;
}

export type EventHandler = (event: Event) => void;

export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SDKError';
  }
} 