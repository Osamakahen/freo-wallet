/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { Buffer } from 'buffer'

declare global {
  interface Navigator {
    deviceMemory?: number
  }
}

export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.pixelDepth,
    screen.width,
    screen.height,
    navigator.hardwareConcurrency,
    navigator.deviceMemory
  ]

  // Create a canvas fingerprint
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    canvas.width = 200
    canvas.height = 50
    
    // Draw some text with specific styling
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    
    // Draw mixed text and shapes
    ctx.fillStyle = '#069'
    ctx.fillText('FreoWallet:)', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Device ID', 4, 17)
    
    components.push(canvas.toDataURL())
  }

  // Create a string from all components
  const fingerprint = components.join('|||')

  // Hash the fingerprint using SHA-256
  const msgBuffer = new TextEncoder().encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

export async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Derive key using PBKDF2
  return await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  ).then(key => crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  ))
}

export async function encrypt(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  )

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64')
  }
}

export async function decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder()
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: Buffer.from(iv, 'base64')
    },
    key,
    Buffer.from(ciphertext, 'base64')
  )

  return decoder.decode(decrypted)
}

export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return Buffer.from(exported).toString('base64')
}

export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(keyData, 'base64')
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  )
} 