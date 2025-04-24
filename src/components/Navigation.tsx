'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wallet, History, Image, Globe, Settings } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import NetworkSelector from '@/components/NetworkSelector';
import ConnectWallet from '@/components/ConnectWallet';

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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-[#00FF88]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-[#00FF88] to-[#FFD700] bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                FreoWallet
              </motion.h1>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NavLink key={item.name} href={item.href}>
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NetworkSelector />
            <ConnectWallet dappOrigin={typeof window !== 'undefined' ? window.location.origin : ''} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <motion.span
        className="text-white/80 hover:text-[#00FF88] transition-colors cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.span>
    </Link>
  );
} 