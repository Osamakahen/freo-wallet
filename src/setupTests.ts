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
    generateKey: jest.fn().mockResolvedValue({
      type: 'secret',
      extractable: true,
      algorithm: { name: 'AES-GCM' },
      usages: ['encrypt', 'decrypt']
    }),
    encrypt: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    decrypt: jest.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
    exportKey: jest.fn().mockResolvedValue(new Uint8Array([7, 8, 9])),
    importKey: jest.fn().mockResolvedValue({
      type: 'secret',
      extractable: true,
      algorithm: { name: 'AES-GCM' },
      usages: ['encrypt', 'decrypt']
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
