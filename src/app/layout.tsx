import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/contexts/WalletContext'
import { TokenProvider } from '@/contexts/TokenContext'
import { NetworkProvider } from '@/contexts/NetworkContext'
import { Navigation } from '@/components/Navigation'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
          <NetworkProvider>
            <TokenProvider>
              <div className="min-h-screen bg-gradient-to-b from-black via-[#1a1a1a] to-black text-white">
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
                <ToastContainer
                  position="bottom-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="dark"
                />
              </div>
            </TokenProvider>
          </NetworkProvider>
        </WalletProvider>
      </body>
    </html>
  )
} 