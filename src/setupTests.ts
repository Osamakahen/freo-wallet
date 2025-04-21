import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock window.crypto for Web Crypto API
const mockCrypto = {
  getRandomValues: (buffer: Uint8Array) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  },
  subtle: {
    generateKey: jest.fn().mockImplementation((...args: unknown[]) => {
      const [algorithm, extractable, keyUsages] = args as [AesKeyGenParams, boolean, KeyUsage[]];
      return {
        type: 'secret',
        extractable,
        algorithm,
        usages: keyUsages
      };
    }),
    encrypt: jest.fn().mockImplementation((...args: unknown[]) => {
      const [algorithm, key, data] = args as [Algorithm, CryptoKey, BufferSource];
      return Promise.resolve(new ArrayBuffer(3));
    }),
    decrypt: jest.fn().mockImplementation((...args: unknown[]) => {
      const [algorithm, key, data] = args as [Algorithm, CryptoKey, BufferSource];
      return Promise.resolve(new ArrayBuffer(3));
    }),
    exportKey: jest.fn().mockImplementation((...args: unknown[]) => {
      const [format, key] = args as [string, CryptoKey];
      return Promise.resolve(new ArrayBuffer(3));
    }),
    importKey: jest.fn().mockImplementation((...args: unknown[]) => {
      const [format, keyData, algorithm, extractable, keyUsages] = args as [string, BufferSource, Algorithm, boolean, KeyUsage[]];
      return {
        type: 'secret',
        extractable,
        algorithm,
        usages: keyUsages
      };
    })
  }
};

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'crypto', {
  value: mockCrypto
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});
