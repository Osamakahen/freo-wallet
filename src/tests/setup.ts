/// <reference types="node" />
/// <reference types="jest" />
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { LocalStorage } from 'node-localstorage';
import { afterEach, beforeAll, afterAll } from '@jest/globals';
import { jest } from '@jest/globals';
import { type EthereumProvider } from '../types/ethereum';
import { type ChainConfig } from '../types/wallet';
import { type Address } from 'viem';

interface MockCryptoSubtle {
  digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer>;
  importKey: (format: string, keyData: ArrayBuffer, algorithm: string | object, extractable: boolean, keyUsages: string[]) => Promise<CryptoKey>;
  exportKey: (format: string, key: CryptoKey) => Promise<ArrayBuffer>;
  encrypt: (algorithm: string | object, key: CryptoKey, data: ArrayBuffer) => Promise<ArrayBuffer>;
  decrypt: (algorithm: string | object, key: CryptoKey, data: ArrayBuffer) => Promise<ArrayBuffer>;
}

interface MockCrypto {
  getRandomValues: (array: Uint8Array) => Uint8Array;
  subtle: MockCryptoSubtle;
}

declare const global: {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
  localStorage: LocalStorage;
  crypto: MockCrypto;
  fetch: typeof fetch;
  ResizeObserver: typeof ResizeObserver;
  IntersectionObserver: typeof IntersectionObserver;
};

// Mock TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof TextDecoder;

// Mock localStorage
global.localStorage = new LocalStorage('./scratch');

// Mock crypto API
const mockCryptoSubtle: MockCryptoSubtle = {
  digest: jest.fn(async (_algorithm: string, _data: Uint8Array) => new ArrayBuffer(32)),
  importKey: jest.fn(async (_format: string, _keyData: ArrayBuffer, _algorithm: string | object, _extractable: boolean, _keyUsages: string[]) => ({} as CryptoKey)),
  exportKey: jest.fn(async (_format: string, _key: CryptoKey) => new ArrayBuffer(32)),
  encrypt: jest.fn(async (_algorithm: string | object, _key: CryptoKey, _data: ArrayBuffer) => new ArrayBuffer(32)),
  decrypt: jest.fn(async (_algorithm: string | object, _key: CryptoKey, _data: ArrayBuffer) => new ArrayBuffer(32))
};

global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: mockCryptoSubtle
};

// Mock fetch
global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => ({
  json: async () => ({}),
  text: async () => '',
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  body: null,
  bodyUsed: false,
  url: typeof input === 'string' ? input : input.toString(),
  type: 'basic' as ResponseType,
  redirected: false,
  clone: function() { return this; },
  arrayBuffer: async () => new ArrayBuffer(0),
  blob: async () => new Blob([]),
  formData: async () => new FormData()
} as Response)) as unknown as typeof fetch;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: readonly number[] = [0];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = () => [];
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ethereum
const mockEthereum: EthereumProvider = {
  request: jest.fn(async (args: { method: string; params?: unknown[] }): Promise<unknown> => {
    switch (args.method) {
      case 'eth_requestAccounts':
        return [mockAddresses.user];
      case 'eth_accounts':
        return [mockAddresses.user];
      case 'eth_chainId':
        return '0x1';
      default:
        return null;
    }
  }),
  on: jest.fn(),
  removeListener: jest.fn(),
  selectedAddress: null,
  chainId: null
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  on: jest.fn(),
  addListener: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  emit: jest.fn(),
  listeners: jest.fn(),
  rawListeners: jest.fn(),
  listenerCount: jest.fn(),
  prependListener: jest.fn(),
  prependOnceListener: jest.fn(),
  eventNames: jest.fn(),
  removeAllListeners: jest.fn(),
  setMaxListeners: jest.fn(),
  getMaxListeners: jest.fn()
} as unknown as LocalStorage;

global.localStorage = localStorageMock;

// Mock network configuration
export const mockNetwork: ChainConfig = {
  chainId: 1,
  name: 'Ethereum',
  symbol: 'ETH',
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
};

// Mock addresses
export const mockAddresses: Record<string, Address> = {
  user: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address,
  recipient: '0x1234567890123456789012345678901234567890' as Address
};

// Mock transaction
export const mockTransaction = {
  from: mockAddresses.user,
  to: mockAddresses.recipient,
  value: '1000000000000000000',
  data: '0x'
};

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// Suppress React deprecated lifecycle warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWill') ||
      args[0].includes('Warning: React.createFactory()'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: componentWill')
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 