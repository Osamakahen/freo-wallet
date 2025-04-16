import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressBookManager } from '../AddressBookManager';
import { AddressBookEntry } from '../../types/address';

describe('AddressBookManager', () => {
  let addressBookManager: AddressBookManager;
  const mockEntries: AddressBookEntry[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test Address 1',
      label: 'Test Label 1'
    },
    {
      address: '0x0987654321098765432109876543210987654321',
      name: 'Test Address 2',
      label: 'Test Label 2'
    }
  ];

  beforeEach(() => {
    // Mock localStorage
    const mockStorage: Storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    global.localStorage = mockStorage;

    addressBookManager = new AddressBookManager();
  });

  describe('loadAddresses', () => {
    it('should load addresses from storage', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(mockEntries));

      const addresses = await addressBookManager.loadAddresses();

      expect(addresses).toEqual(mockEntries);
      expect(localStorage.getItem).toHaveBeenCalledWith('addressBook');
    });

    it('should return empty array if no addresses in storage', async () => {
      vi.spyOn(localStorage, 'getItem').mockReturnValue(null);

      const addresses = await addressBookManager.loadAddresses();

      expect(addresses).toEqual([]);
    });
  });

  describe('saveAddresses', () => {
    it('should save addresses to storage', async () => {
      await addressBookManager.saveAddresses(mockEntries);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'addressBook',
        JSON.stringify(mockEntries)
      );
    });
  });

  describe('addAddress', () => {
    it('should add a new address', async () => {
      const newEntry: AddressBookEntry = {
        address: '0x1111111111111111111111111111111111111111',
        name: 'New Address',
        label: 'New Label'
      };

      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);
      const saveSpy = vi.spyOn(addressBookManager, 'saveAddresses');

      await addressBookManager.addAddress(newEntry);

      expect(saveSpy).toHaveBeenCalledWith([...mockEntries, newEntry]);
    });

    it('should throw error if address already exists', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);

      await expect(
        addressBookManager.addAddress(mockEntries[0])
      ).rejects.toThrow('Address already exists in address book');
    });
  });

  describe('removeAddress', () => {
    it('should remove an address', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);
      const saveSpy = vi.spyOn(addressBookManager, 'saveAddresses');

      await addressBookManager.removeAddress(mockEntries[0].address);

      expect(saveSpy).toHaveBeenCalledWith([mockEntries[1]]);
    });

    it('should throw error if address not found', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);

      await expect(
        addressBookManager.removeAddress('0xinvalid')
      ).rejects.toThrow('Address not found in address book');
    });
  });

  describe('searchAddresses', () => {
    it('should search addresses by query', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);

      const results = await addressBookManager.searchAddresses('Test Address 1');

      expect(results).toEqual([mockEntries[0]]);
    });

    it('should return empty array if no matches', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);

      const results = await addressBookManager.searchAddresses('Nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('isAddressSaved', () => {
    it('should check if address exists', async () => {
      vi.spyOn(addressBookManager, 'loadAddresses').mockResolvedValue(mockEntries);

      const exists = await addressBookManager.isAddressSaved(mockEntries[0].address);
      const notExists = await addressBookManager.isAddressSaved('0xinvalid');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('validateAddress', () => {
    it('should validate Ethereum addresses', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      const invalidAddress = '0xinvalid';

      expect(addressBookManager.validateAddress(validAddress)).toBe(true);
      expect(addressBookManager.validateAddress(invalidAddress)).toBe(false);
    });
  });
}); 