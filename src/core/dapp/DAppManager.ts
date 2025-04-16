import { type DAppManifest, DAppPermission } from '../../types/dapp';
import { type EVMAdapter } from '../chain/EVMAdapter';
import { type SessionManager } from '../session/SessionManager';
import { type SecurityManager } from '../security/SecurityManager';
import { WalletError } from '../error/ErrorHandler';
import { type TransactionRequest } from '../../types/wallet';
import { type Address } from 'viem';

export class DAppManager {
  private sessions: Map<string, DAppManifest> = new Map();
  private readonly adapter: EVMAdapter;
  private readonly sessionManager: SessionManager;
  private readonly securityManager: SecurityManager;

  constructor(
    adapter: EVMAdapter,
    sessionManager: SessionManager,
    securityManager: SecurityManager
  ) {
    this.adapter = adapter;
    this.sessionManager = sessionManager;
    this.securityManager = securityManager;
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

    const session = await this.sessionManager.createSession(
      await this.adapter.getAddress(),
      this.adapter.getChain().id
    );

    if (!session) {
      throw new WalletError('Failed to create session', 'SESSION_CREATION_FAILED');
    }

    return session.token.toString();
  }

  async signMessage(dappId: string, message: string): Promise<string> {
    await this.hasPermission(dappId, DAppPermission.MESSAGE_SIGN);
    const session = await this.sessionManager.getActiveSession();
    if (!session) {
      throw new WalletError('Session not found', 'SESSION_NOT_FOUND');
    }

    return this.adapter.signMessage(message);
  }

  async sendTransaction(dappId: string, tx: TransactionRequest): Promise<string> {
    await this.hasPermission(dappId, DAppPermission.TRANSACTION);
    const session = await this.sessionManager.getActiveSession();
    if (!session) {
      throw new WalletError('Session not found', 'SESSION_NOT_FOUND');
    }

    const txDetails = {
      to: tx.to as Address,
      value: BigInt(tx.value || '0'),
      data: tx.data as `0x${string}`,
      gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
      maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
      nonce: tx.nonce
    };

    const preparedTx = await this.adapter.prepareTransaction(txDetails);
    return this.adapter.broadcastTransaction(preparedTx as `0x${string}`);
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

    const currentChainId = this.adapter.getChain().id;
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
    await this.sessionManager.revokeSession();
    this.sessions.delete(dappId);
    this.saveRegisteredDApps();
  }

  async hasPermission(dappId: string, permission: DAppPermission): Promise<boolean> {
    const manifest = this.sessions.get(dappId);
    if (!manifest) {
      throw new WalletError(`DApp not found: ${dappId}`, 'DAPP_NOT_FOUND');
    }

    if (!manifest.permissions.includes(permission)) {
      throw new WalletError(`DApp ${dappId} does not have permission: ${permission}`, 'PERMISSION_DENIED');
    }

    return true;
  }
}
