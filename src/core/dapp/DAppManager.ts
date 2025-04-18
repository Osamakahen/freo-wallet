import { type DAppManifest, DAppPermission } from '../../types/dapp';
import { type EVMAdapter } from '../chain/EVMAdapter';
import { type SessionManager } from '../session/SessionManager';
import { WalletError } from '../error/ErrorHandler';
import { type TransactionRequest } from '../../types/wallet';
import { type Address } from 'viem';

export class DAppManager {
  private sessions: Map<string, DAppManifest> = new Map();
  private readonly adapter: EVMAdapter;
  private readonly sessionManager: SessionManager;

  constructor(
    adapter: EVMAdapter,
    sessionManager: SessionManager
  ) {
    this.adapter = adapter;
    this.sessionManager = sessionManager;
    this.loadRegisteredDApps();
  }

  async registerDApp(manifest: DAppManifest): Promise<void> {
    this.validateManifest(manifest);
    this.sessions.set(manifest.id, manifest);
    this.saveRegisteredDApps();
  }

  async connect(dappId: string): Promise<string> {
    const manifest = this.sessions.get(dappId);
    if (!manifest) {
      throw new WalletError('DApp not found', 'DAPP_NOT_FOUND');
    }

    const client = this.adapter.getClient();
    if (!client) {
      throw new WalletError('Wallet client not set', 'CLIENT_NOT_SET');
    }

    const address = await client.getAddresses().then((addrs: Address[]) => addrs[0]);
    const chainId = this.adapter.getChainId();
    
    const session = await this.sessionManager.createSession({
      address,
      chainId
    });

    if (!session) {
      throw new WalletError('Failed to create session', 'SESSION_CREATION_FAILED');
    }

    return session.id;
  }

  async signMessage(dappId: string, message: string): Promise<string> {
    await this.hasPermission(dappId, 'MESSAGE_SIGN');
    const session = await this.sessionManager.getActiveSession();
    if (!session) {
      throw new WalletError('Session not found', 'SESSION_NOT_FOUND');
    }

    const client = this.adapter.getClient();
    if (!client) {
      throw new WalletError('Wallet client not set', 'CLIENT_NOT_SET');
    }

    const address = await client.getAddresses().then((addrs: Address[]) => addrs[0]);
    return client.signMessage({ account: address, message });
  }

  async sendTransaction(dappId: string, tx: TransactionRequest): Promise<string> {
    await this.hasPermission(dappId, 'TRANSACTION');
    const session = await this.sessionManager.getActiveSession();
    if (!session) {
      throw new WalletError('Session not found', 'SESSION_NOT_FOUND');
    }

    // Convert our TransactionRequest to viem's TransactionRequest
    const viemTx = {
      to: tx.to as Address,
      value: BigInt(tx.value || '0'),
      data: tx.data as `0x${string}`,
      gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
      maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
      nonce: tx.nonce,
      type: 'eip1559' as const
    };

    return this.adapter.sendTransaction(viemTx);
  }

  private validateManifest(manifest: DAppManifest): void {
    if (!manifest.id) {
      throw new WalletError('DApp manifest must include an ID', 'INVALID_MANIFEST');
    }

    if (!manifest.permissions || manifest.permissions.length === 0) {
      throw new WalletError('DApp manifest must include permissions', 'INVALID_MANIFEST');
    }

    if (!manifest.chains || manifest.chains.length === 0) {
      throw new WalletError('DApp manifest must include supported chains', 'INVALID_MANIFEST');
    }

    const currentChainId = this.adapter.getChainId();
    if (!manifest.chains.includes(currentChainId)) {
      throw new WalletError(`Chain ${currentChainId} not supported by DApp`, 'UNSUPPORTED_CHAIN');
    }
  }

  private saveRegisteredDApps(): void {
    const dapps = Array.from(this.sessions.values());
    localStorage.setItem('registeredDApps', JSON.stringify(dapps));
  }

  private loadRegisteredDApps(): void {
    const stored = localStorage.getItem('registeredDApps');
    if (stored) {
      const dapps: DAppManifest[] = JSON.parse(stored);
      dapps.forEach(dapp => this.sessions.set(dapp.id, dapp));
    }
  }

  async disconnect(dappId: string): Promise<void> {
    const session = await this.sessionManager.getActiveSession();
    if (session) {
      await this.sessionManager.revokeSession(session.id);
    }
    this.sessions.delete(dappId);
    this.saveRegisteredDApps();
  }

  async hasPermission(dappId: string, permission: string): Promise<boolean> {
    const manifest = this.sessions.get(dappId);
    if (!manifest) {
      throw new WalletError(`DApp not found: ${dappId}`, 'DAPP_NOT_FOUND');
    }

    if (!manifest.permissions.includes(permission as DAppPermission)) {
      throw new WalletError(`DApp ${dappId} does not have permission: ${permission}`, 'PERMISSION_DENIED');
    }

    const session = await this.sessionManager.getActiveSession();
    if (session) {
      // Basic session validation
      const sessionDuration = Date.now() - session.lastActivity;
      if (sessionDuration > 24 * 60 * 60 * 1000) { // 24 hours
        throw new WalletError('Session expired', 'SESSION_EXPIRED');
      }
    }

    return true;
  }
}
