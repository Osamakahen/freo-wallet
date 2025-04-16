import React, { useState, useEffect, useCallback } from 'react';
import { AddressBookManager } from '../core/address/AddressBookManager';
import { AddressBookEntry, AddressBookState } from '../types/address';
import { Address } from 'viem';
import { formatAddress } from '../utils/format';

interface AddressBookProps {
  addressBookManager: AddressBookManager;
  onSelectAddress: (address: string) => void;
}

export const AddressBook: React.FC<AddressBookProps> = ({
  addressBookManager,
  onSelectAddress
}) => {
  const [state, setState] = useState<AddressBookState>({
    addresses: [],
    loading: true,
    error: null,
    searchQuery: '',
    newAddress: {
      address: '',
      name: '',
      label: ''
    }
  });

  const loadAddresses = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const addresses = await addressBookManager.getAddresses();
      setState(prev => ({ ...prev, addresses, loading: false }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load addresses';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [addressBookManager]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSearch = async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    const filteredAddresses = await addressBookManager.searchAddresses(query);
    setState(prev => ({ ...prev, addresses: filteredAddresses }));
  };

  const handleAddAddress = async () => {
    try {
      const { address, name, label } = state.newAddress;
      if (!address || !name) {
        throw new Error('Address and name are required');
      }

      await addressBookManager.addAddress(address as Address, name, label);
      await loadAddresses();

      setState(prev => ({
        ...prev,
        newAddress: { address: '', name: '', label: '' }
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add address';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  const handleRemoveAddress = async (address: Address) => {
    try {
      await addressBookManager.removeAddress(address);
      await loadAddresses();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove address';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  if (state.loading) {
    return <div>Loading addresses...</div>;
  }

  if (state.error) {
    return <div>Error: {state.error}</div>;
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
            value={state.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Address (0x...)"
            className="border rounded px-3 py-2"
            value={state.newAddress.address}
            onChange={(e) => setState(prev => ({
              ...prev,
              newAddress: { ...prev.newAddress, address: e.target.value }
            }))}
          />
          <input
            type="text"
            placeholder="Name"
            className="border rounded px-3 py-2"
            value={state.newAddress.name}
            onChange={(e) => setState(prev => ({
              ...prev,
              newAddress: { ...prev.newAddress, name: e.target.value }
            }))}
          />
          <input
            type="text"
            placeholder="Label (optional)"
            className="border rounded px-3 py-2"
            value={state.newAddress.label}
            onChange={(e) => setState(prev => ({
              ...prev,
              newAddress: { ...prev.newAddress, label: e.target.value }
            }))}
          />
        </div>
        <button
          className="mt-4 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          onClick={handleAddAddress}
        >
          Add Address
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {state.addresses.map((entry: AddressBookEntry) => (
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