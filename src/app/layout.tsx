import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/contexts/WalletContext'
import { TokenProvider } from '@/contexts/TokenContext'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Freo Wallet',
  description: 'A modern crypto wallet for the decentralized web',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enable development mode if INFURA_URL is set
  const isDevMode = !!process.env.NEXT_PUBLIC_INFURA_URL;

  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider devMode={isDevMode}>
          <TokenProvider>
            <div className="min-h-screen bg-[#6B3FA0] text-white">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </TokenProvider>
        </WalletProvider>
      </body>
    </html>
  )
} 