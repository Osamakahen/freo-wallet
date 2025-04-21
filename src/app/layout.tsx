import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/hooks/useWallet'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Freo Wallet',
  description: 'A modern Ethereum wallet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
} 