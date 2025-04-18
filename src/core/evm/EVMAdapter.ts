import { WalletAdapter } from './WalletAdapter';
import { Chain } from 'viem/chains';

export class EVMAdapter extends WalletAdapter {
  constructor(chain: Chain) {
    super(chain);
  }
} 