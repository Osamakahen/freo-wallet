import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressBook } from '../AddressBook';
import { AddressBookManager } from '../../core/address/AddressBookManager';
import { SavedAddress } from '../../types/wallet';

const mockAddressBookManager: Partial<AddressBookManager> = {
  addAddress: vi.fn(),
  removeAddress: vi.fn(),
  searchAddresses: vi.fn(),
  isAddressSaved: vi.fn(),
  loadAddresses: vi.fn(),
  saveAddresses: vi.fn(),
  validateAddress: vi.fn()
};

describe('AddressBook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(mockAddressBookManager.getAllAddresses).mockReturnValue([]);
    render(<AddressBook addressBookManager={mockAddressBookManager} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders saved addresses', async () => {
    const mockAddresses: SavedAddress[] = [
      {
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        name: 'Test Address 1',
        label: 'Test Label 1',
        createdAt: Date.now()
      },
      {
        address: '0x0987654321098765432109876543210987654321' as `0x${string}`,
        name: 'Test Address 2',
        label: 'Test Label 2',
        createdAt: Date.now()
      }
    ];

    vi.mocked(mockAddressBookManager.getAllAddresses).mockReturnValue(mockAddresses);
    render(<AddressBook addressBookManager={mockAddressBookManager} />);

    await waitFor(() => {
      expect(screen.getByText('Test Address 1')).toBeInTheDocument();
      expect(screen.getByText('Test Address 2')).toBeInTheDocument();
    });
  });

  it('searches addresses', async () => {
    const mockAddresses: SavedAddress[] = [
      {
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        name: 'Test Address 1',
        label: 'Test Label 1',
        createdAt: Date.now()
      }
    ];

    vi.mocked(mockAddressBookManager.getAllAddresses).mockReturnValue(mockAddresses);
    vi.mocked(mockAddressBookManager.searchAddresses).mockReturnValue(mockAddresses);

    render(<AddressBook addressBookManager={mockAddressBookManager} />);

    const searchInput = screen.getByPlaceholderText('Search addresses...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(mockAddressBookManager.searchAddresses).toHaveBeenCalledWith('Test');
      expect(screen.getByText('Test Address 1')).toBeInTheDocument();
    });
  });

  it('adds new address', async () => {
    vi.mocked(mockAddressBookManager.getAllAddresses).mockReturnValue([]);
    vi.mocked(mockAddressBookManager.addAddress).mockImplementation(() => {});

    render(<AddressBook addressBookManager={mockAddressBookManager} />);

    const addButton = screen.getByText('Add Address');
    fireEvent.click(addButton);

    const addressInput = screen.getByPlaceholderText('Enter address');
    const nameInput = screen.getByPlaceholderText('Enter name');
    const labelInput = screen.getByPlaceholderText('Enter label (optional)');

    fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.change(nameInput, { target: { value: 'Test Address' } });
    fireEvent.change(labelInput, { target: { value: 'Test Label' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddressBookManager.addAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0x1234567890123456789012345678901234567890',
          name: 'Test Address',
          label: 'Test Label'
        })
      );
    });
  });

  it('removes address', async () => {
    const mockAddresses: SavedAddress[] = [
      {
        address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        name: 'Test Address',
        label: 'Test Label',
        createdAt: Date.now()
      }
    ];

    vi.mocked(mockAddressBookManager.getAllAddresses).mockReturnValue(mockAddresses);
    vi.mocked(mockAddressBookManager.removeAddress).mockImplementation(() => {});

    render(<AddressBook addressBookManager={mockAddressBookManager} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockAddressBookManager.removeAddress).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890'
      );
    });
  });
}); 