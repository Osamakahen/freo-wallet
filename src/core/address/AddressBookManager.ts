import { Address } from 'viem';
import { AddressBookEntry } from '../../types/address';

export class AddressBookManager {
  private addresses: AddressBookEntry[] = [];

  constructor() {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    const savedAddresses = localStorage.getItem('addressBook');
    if (savedAddresses) {
      this.addresses = JSON.parse(savedAddresses);
    }
  }

  private saveAddresses(): void {
    localStorage.setItem('addressBook', JSON.stringify(this.addresses));
  }

  public async getAddresses(): Promise<AddressBookEntry[]> {
    return this.addresses;
  }

  public async addAddress(address: Address, name: string, label: string): Promise<void> {
    if (!this.validateAddress(address)) {
      throw new Error('Invalid address');
    }

    if (this.isAddressSaved(address)) {
      throw new Error('Address already exists');
    }

    this.addresses.push({ address, name, label });
    this.saveAddresses();
  }

  public async removeAddress(address: Address): Promise<void> {
    this.addresses = this.addresses.filter(entry => entry.address !== address);
    this.saveAddresses();
  }

  public async searchAddresses(query: string): Promise<AddressBookEntry[]> {
    const lowerQuery = query.toLowerCase();
    return this.addresses.filter(entry => 
      entry.address.toLowerCase().includes(lowerQuery) ||
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.label.toLowerCase().includes(lowerQuery)
    );
  }

  public isAddressSaved(address: Address): boolean {
    return this.addresses.some(entry => entry.address === address);
  }

  private validateAddress(address: Address): boolean {
    // Basic address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
} 