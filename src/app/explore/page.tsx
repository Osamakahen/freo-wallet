'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import CategoryFilters from './components/CategoryFilters';

interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  url: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All', icon: '🌐' },
  { id: 'defi', name: 'DeFi', icon: '💰' },
  { id: 'nft', name: 'NFT', icon: '🖼️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'social', name: 'Social', icon: '👥' },
];

const sampleApps: App[] = [
  {
    id: '1',
    name: 'FreoWallet',
    description: 'Your secure Web3 wallet for the FreoBus ecosystem',
    category: 'defi',
    icon: '/icons/wallet.png',
    url: '/wallet',
  },
  {
    id: '2',
    name: 'NFT Marketplace',
    description: 'Buy, sell, and trade NFTs on FreoBus',
    category: 'nft',
    icon: '/icons/nft.png',
    url: '/nft',
  },
  // Add more sample apps as needed
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  );

  const filteredApps = useMemo(() => {
    return sampleApps.filter((app) => {
      const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Explore Apps</h1>
            <div className="w-full sm:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => debouncedSearch(e.target.value)}
                  aria-label="Search apps"
                />
                <span className="absolute left-3 top-2.5 text-gray-400" aria-hidden="true">
                  🔍
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryFilters
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12">
                    <Image
                      src={app.icon}
                      alt={`${app.name} icon`}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <a
                    href={app.url}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Launch App
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
} 