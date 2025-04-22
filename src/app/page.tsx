'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WalletModal } from '@/components/wallet/WalletModal';
import { TokenList } from '@/components/TokenList';
import TransactionHistory from '@/components/TransactionHistory';
import { useWallet } from '@/contexts/WalletContext';
import { useToken } from '@/contexts/TokenContext';
import { formatEther } from 'ethers';
import { COLORS, SHADOWS, ANIMATIONS } from '@/constants/design';
import { CHAINS } from '@/constants/chains';
import { Lock } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { HeroSection } from '@/components/HeroSection';
import { FeatureCards } from '@/components/FeatureCards';
import { AssetDashboard } from '@/components/AssetDashboard';
import { DAppShowcase } from '@/components/DAppShowcase';
import { SocialProof } from '@/components/SocialProof';
import { ConversionFooter } from '@/components/ConversionFooter';

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeatureCards />
      <AssetDashboard />
      <DAppShowcase />
      <SocialProof />
      <ConversionFooter />
    </main>
  );
} 