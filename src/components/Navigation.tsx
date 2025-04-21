import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, History, Image, Globe, Settings } from 'lucide-react';

const navigationItems = [
  {
    name: 'Portfolio',
    href: '/',
    icon: Wallet,
  },
  {
    name: 'Transactions',
    href: '/history',
    icon: History,
  },
  {
    name: 'NFTs',
    href: '/nfts',
    icon: Image,
  },
  {
    name: 'DApps',
    href: '/dapps',
    icon: Globe,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-800 md:relative md:border-r md:border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-[10%] min-w-[120px]"
            >
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  FreoWallet
                </span>
              </Link>
            </motion.div>
            <div className="flex items-center space-x-4 md:space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-2 h-5 w-5 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 