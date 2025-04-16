import { Address } from 'viem';

export interface AddressBookEntry {
  address: Address;
  name: string;
  label: string;
  chainId: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressBookState {
  entries: AddressBookEntry[];
  selectedEntry: AddressBookEntry | null;
  error: Error | null;
}

export interface AddressBookConfig {
  maxEntries: number;
  allowDuplicates: boolean;
  requireLabel: boolean;
  defaultChainId: number;
} 