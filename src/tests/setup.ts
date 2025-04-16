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

declare const global: {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
  localStorage: LocalStorage;
  crypto: {
    getRandomValues: (array: Uint8Array) => Uint8Array;
    subtle: {
      digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer>;
      importKey: (format: string, keyData: ArrayBuffer, algorithm: string | object, extractable: boolean, keyUsages: string[]) => Promise<CryptoKey>;
      exportKey: (format: string, key: CryptoKey) => Promise<ArrayBuffer>;
      encrypt: (algorithm: string | object, key: CryptoKey, data: ArrayBuffer) => Promise<ArrayBuffer>;
      decrypt: (algorithm: string | object, key: CryptoKey, data: ArrayBuffer) => Promise<ArrayBuffer>;
    };
  };
  fetch: typeof fetch;
  ResizeObserver: typeof ResizeObserver;
  IntersectionObserver: typeof IntersectionObserver;
};

// Mock TextEncoder and TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock localStorage
global.localStorage = new LocalStorage('./scratch');

// Mock crypto API
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: jest.fn(),
    importKey: jest.fn(),
    exportKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

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
  request: jest.fn().mockImplementation(async (method: string, params?: unknown[]) => {
    return Promise.resolve(undefined);
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
  key: jest.fn()
} as unknown as Storage;

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
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: componentWill') ||
      args[0].includes('Warning: React.createFactory()')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
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