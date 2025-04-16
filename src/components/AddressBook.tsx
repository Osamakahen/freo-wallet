import React, { useState, useEffect, useCallback } from 'react';
import { AddressBookManager } from '../core/address/AddressBookManager';
import { AddressBookState } from '../types/address';
import { Address } from 'viem';
import { formatAddress } from '../utils/format';

interface AddressBookProps {
  addressBookManager: AddressBookManager;
  onSelectAddress: (address: string) => void;
}

interface NewAddressForm {
  address: string;
  name: string;
  label: string;
}

export const AddressBook: React.FC<AddressBookProps> = ({
  addressBookManager,
  onSelectAddress
}) => {
  const [state, setState] = useState<AddressBookState>({
    entries: [],
    selectedEntry: null,
    error: null
  });

  const [newAddress, setNewAddress] = useState<NewAddressForm>({
    address: '',
    name: '',
    label: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  const loadAddresses = useCallback(async () => {
    try {
      const entries = await addressBookManager.getAddresses();
      setState(prev => ({ ...prev, entries, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to load addresses')
      }));
    }
  }, [addressBookManager]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const filteredEntries = await addressBookManager.searchAddresses(query);
    setState(prev => ({ ...prev, entries: filteredEntries }));
  };

  const handleAddAddress = async () => {
    try {
      const { address, name, label } = newAddress;
      if (!address || !name) {
        throw new Error('Address and name are required');
      }

      await addressBookManager.addAddress(address as Address, name, label);
      await loadAddresses();

      setNewAddress({
        address: '',
        name: '',
        label: ''
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to add address')
      }));
    }
  };

  const handleRemoveAddress = async (address: Address) => {
    try {
      await addressBookManager.removeAddress(address);
      await loadAddresses();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to remove address')
      }));
    }
  };

  if (state.error) {
    return <div>Error: {state.error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Address Book</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search addresses..."
            className="border rounded px-3 py-2"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {(state.error as Error).message}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Address (0x...)"
            className="border rounded px-3 py-2"
            value={newAddress.address}
            onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Name"
            className="border rounded px-3 py-2"
            value={newAddress.name}
            onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Label (optional)"
            className="border rounded px-3 py-2"
            value={newAddress.label}
            onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
          />
        </div>
        <button
          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          onClick={handleAddAddress}
        >
          Add Address
        </button>
      </div>

      <div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {state.entries.map((entry) => (
              <tr key={entry.address} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {entry.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatAddress(entry.address)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {entry.label || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="text-primary-600 hover:text-primary-900 mr-4"
                    onClick={() => onSelectAddress(entry.address)}
                  >
                    Select
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleRemoveAddress(entry.address)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 