import { type Address, type Hash } from 'viem';
import { type Chain } from 'viem/chains';
import { EventData } from '../types/events';

export interface WalletState {
  address: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  chain: Chain | null;
  error: Error | null;
}

export interface WalletBalance {
  balance: bigint;
  symbol: string;
  decimals: number;
}

export interface WalletTransaction {
  hash: Hash;
  to: Address;
  from: Address;
  value: bigint;
  data: `0x${string}`;
  chainId: number;
  status?: 'pending' | 'confirmed' | 'failed';
  timestamp?: number;
}

export interface WalletInterface {
  connect(): Promise<Address>;
  disconnect(): Promise<void>;
  getAddress(): Address | null;
  getChain(): Chain | null;
  switchChain(chainId: number): Promise<void>;
  getBalance(address?: Address): Promise<WalletBalance>;
  sendTransaction(transaction: Partial<WalletTransaction>): Promise<Hash>;
  signMessage(message: string): Promise<`0x${string}`>;
  getTransactionHistory(address: Address): Promise<WalletTransaction[]>;
  estimateGas(transaction: Partial<WalletTransaction>): Promise<bigint>;
  on(event: string, callback: (data: EventData) => void): void;
  off(event: string, callback: (data: EventData) => void): void;
} 