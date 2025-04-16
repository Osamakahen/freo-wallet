import { DocumentationGenerator } from '../docs/DocumentationGenerator';
import path from 'path';

const generator = new DocumentationGenerator({
  outputDir: path.join(process.cwd(), 'docs'),
  format: 'markdown',
  includePrivate: false
});

// Generate documentation for core components
generator.generate([
  // Core wallet components
  'src/core/wallet/WalletManager.ts',
  'src/core/wallet/HardwareWalletManager.ts',
  'src/core/wallet/KeyManager.ts',
  
  // Core token components
  'src/core/token/TokenManager.ts',
  
  // Core dApp components
  'src/core/dapp/DAppBridge.ts',
  
  // Services
  'src/services/AnalyticsService.ts',
  
  // Utils
  'src/utils/secureStorage.ts',
  'src/utils/biometricAuth.ts',
  
  // Types
  'src/types/gas.ts',
  'src/types/address.ts',
  'src/sdk/types.ts'
]);

console.log('Documentation generated successfully!'); 