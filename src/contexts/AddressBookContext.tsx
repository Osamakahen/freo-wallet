import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Contact {
  id: string;
  name: string;
  address: string;
  chainId: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface AddressBookState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
}

interface AddressBookContextType extends AddressBookState {
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContact: (id: string) => Contact | undefined;
  getContactsByChain: (chainId: number) => Contact[];
  searchContacts: (query: string) => Contact[];
}

const AddressBookContext = createContext<AddressBookContextType | undefined>(undefined);

export const AddressBookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AddressBookState>({
    contacts: [],
    isLoading: false,
    error: null
  });

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setState(prev => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.map(contact =>
        contact.id === id
          ? { ...contact, ...updates, updatedAt: Date.now() }
          : contact
      )
    }));
  };

  const deleteContact = (id: string) => {
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.filter(contact => contact.id !== id)
    }));
  };

  const getContact = (id: string) => {
    return state.contacts.find(contact => contact.id === id);
  };

  const getContactsByChain = (chainId: number) => {
    return state.contacts.filter(contact => contact.chainId === chainId);
  };

  const searchContacts = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return state.contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.address.toLowerCase().includes(lowerQuery) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  return (
    <AddressBookContext.Provider
      value={{
        ...state,
        addContact,
        updateContact,
        deleteContact,
        getContact,
        getContactsByChain,
        searchContacts
      }}
    >
      {children}
    </AddressBookContext.Provider>
  );
};

export const useAddressBook = () => {
  const context = useContext(AddressBookContext);
  if (context === undefined) {
    throw new Error('useAddressBook must be used within an AddressBookProvider');
  }
  return context;
}; 