import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock localStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = mockStorage as any;

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn()
};
global.window.ethereum = mockEthereum as any;

// Mock crypto.subtle
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      deriveKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn()
    }
  }
});

// Mock window.crypto
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      deriveKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn()
    }
  }
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'en-US',
    platform: 'test-platform',
    hardwareConcurrency: 4,
    deviceMemory: 8
  }
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
    pixelDepth: 24
  }
});

// Mock Intl
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({
        timeZone: 'UTC'
      })
    })
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 