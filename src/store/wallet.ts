import { create } from 'zustand'
import { type Address } from 'viem'

interface WalletState {
  address: Address | null
  isConnected: boolean
  balance: string
  setAddress: (address: Address | null) => void
  setConnected: (isConnected: boolean) => void
  setBalance: (balance: string) => void
}

const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  balance: '',
  setAddress: (address) => set({ address }),
  setConnected: (isConnected) => set({ isConnected }),
  setBalance: (balance) => set({ balance }),
}))

export default useWalletStore 