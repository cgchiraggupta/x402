import { create } from "zustand";
import { TokenBalance } from "@/lib/tools/wallet";

interface WalletState {
  address: string | null;
  balances: TokenBalance[];
  isConnected: boolean;
  isConnecting: boolean;
  network: "TESTNET" | "PUBLIC" | null;
  portfolioValueUSD: number;
  
  setAddress: (address: string | null) => void;
  setBalances: (balances: TokenBalance[]) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setNetwork: (network: "TESTNET" | "PUBLIC" | null) => void;
  setPortfolioValueUSD: (value: number) => void;
  disconnect: () => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  balances: [],
  isConnected: false,
  isConnecting: false,
  network: null,
  portfolioValueUSD: 0,
  
  setAddress: (address) => set({ address }),
  setBalances: (balances) => set({ balances }),
  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setNetwork: (network) => set({ network }),
  setPortfolioValueUSD: (portfolioValueUSD) => set({ portfolioValueUSD }),
  
  disconnect: () => set({ 
    address: null, 
    balances: [], 
    isConnected: false,
    portfolioValueUSD: 0 
  }),
  
  clearWallet: () => set({
    address: null,
    balances: [],
    isConnected: false,
    isConnecting: false,
    network: null,
    portfolioValueUSD: 0
  })
}));