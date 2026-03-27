import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Transaction {
  id: string;
  hash: string;
  type: "swap" | "deposit" | "withdraw" | "x402";
  status: "pending" | "confirmed" | "failed";
  amount: string;
  details: {
    from?: string;
    to?: string;
    poolId?: string;
    poolName?: string;
    query?: string;
    pricePaid?: number;
    [key: string]: any;
  };
  timestamp: number;
  walletAddress: string;
  explorerUrl?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
  getTransactionsByWallet: (walletAddress: string) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      
      addTransaction: (tx) => {
        const id = crypto.randomUUID();
        const newTransaction: Transaction = {
          ...tx,
          id,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        
        return id;
      },
      
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        }));
      },
      
      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },
      
      clearTransactions: () => {
        set({ transactions: [] });
      },
      
      getTransactionsByWallet: (walletAddress) => {
        return get().transactions.filter(
          (tx) => tx.walletAddress === walletAddress
        );
      },
      
      getRecentTransactions: (limit = 10) => {
        return get()
          .transactions.sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      },
    }),
    {
      name: "stellar-defi-transactions",
      version: 1,
    }
  )
);

/**
 * Helper to create transaction from AI response
 */
export function createTransactionFromAI(
  type: Transaction["type"],
  details: any,
  walletAddress: string,
  hash?: string
): Omit<Transaction, "id" | "timestamp"> {
  const baseTx: Omit<Transaction, "id" | "timestamp"> = {
    hash: hash || `local_${Date.now()}`,
    type,
    status: hash ? "confirmed" : "pending",
    amount: details.amount || "0",
    details,
    walletAddress,
  };

  // Add explorer URL if we have a real hash
  if (hash && !hash.startsWith("local_") && !hash.startsWith("x402_")) {
    const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET";
    const baseUrl = isTestnet
      ? "https://stellar.expert/explorer/testnet/tx"
      : "https://stellar.expert/explorer/public/tx";
    baseTx.explorerUrl = `${baseUrl}/${hash}`;
  }

  return baseTx;
}

/**
 * Sync transactions from blockchain
 */
export async function syncTransactionsFromBlockchain(
  walletAddress: string
): Promise<void> {
  try {
    // In a real implementation, we would:
    // 1. Fetch transactions from Horizon API
    // 2. Merge with local transactions
    // 3. Update statuses
    
    console.log(`Syncing transactions for ${walletAddress}`);
    
    // For now, just mark pending transactions as confirmed if they have hashes
    const store = useTransactionStore.getState();
    const walletTxs = store.getTransactionsByWallet(walletAddress);
    
    walletTxs.forEach((tx) => {
      if (tx.status === "pending" && tx.hash && !tx.hash.startsWith("local_")) {
        // Assume confirmed after 30 seconds for demo
        if (Date.now() - tx.timestamp > 30000) {
          store.updateTransaction(tx.id, { status: "confirmed" });
        }
      }
    });
  } catch (error) {
    console.error("Failed to sync transactions:", error);
  }
}