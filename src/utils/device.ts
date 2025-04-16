import { createHash } from 'crypto';

/**
 * Generates a unique device fingerprint based on available browser/device characteristics
 * @returns A promise that resolves to a hex string representing the device fingerprint
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components: string[] = [];

  // Browser user agent
  if (typeof navigator !== 'undefined') {
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(navigator.platform);
    components.push(navigator.hardwareConcurrency?.toString() || '');
    components.push(navigator.deviceMemory?.toString() || '');
  }

  // Screen characteristics
  if (typeof screen !== 'undefined') {
    components.push(screen.width.toString());
    components.push(screen.height.toString());
    components.push(screen.colorDepth.toString());
    components.push(screen.pixelDepth.toString());
  }

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Canvas fingerprint (if available)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('FreoWallet', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('FreoWallet', 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    // Canvas fingerprinting not available
  }

  // Combine all components and hash
  const combined = components.join('|');
  return createHash('sha256').update(combined).digest('hex');
} 