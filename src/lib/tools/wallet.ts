import { horizonServer } from "../stellar/client";

export interface TokenBalance {
  asset: string;
  balance: string;
  assetCode: string;
  assetIssuer?: string;
  usdValue?: number;
}

export async function get_wallet_balances(wallet_address: string): Promise<TokenBalance[]> {
  try {
    const account = await horizonServer.loadAccount(wallet_address);
    
    const balances: TokenBalance[] = account.balances.map((balance: any) => {
      if (balance.asset_type === "native") {
        return {
          asset: "XLM",
          balance: balance.balance,
          assetCode: "XLM",
        };
      }
      return {
        asset: `${balance.asset_code}:${balance.asset_issuer}`,
        balance: balance.balance,
        assetCode: balance.asset_code,
        assetIssuer: balance.asset_issuer,
      };
    });
    
    // Try to get USD values for major tokens
    const balancesWithUSD = await Promise.all(
      balances.map(async (balance) => {
        try {
          // For demo purposes, use fixed prices
          // In production, fetch from Soroswap API or CoinGecko
          let usdValue = 0;
          if (balance.assetCode === "XLM") {
            usdValue = parseFloat(balance.balance) * 0.12; // Approx XLM price
          } else if (balance.assetCode === "USDC") {
            usdValue = parseFloat(balance.balance) * 1.0; // USDC is 1:1 with USD
          } else if (balance.assetCode === "BTC") {
            usdValue = parseFloat(balance.balance) * 65000; // Approx BTC price
          } else if (balance.assetCode === "ETH") {
            usdValue = parseFloat(balance.balance) * 3500; // Approx ETH price
          }
          
          return {
            ...balance,
            usdValue: parseFloat(usdValue.toFixed(2))
          };
        } catch {
          return balance;
        }
      })
    );
    
    return balancesWithUSD;
  } catch (error) {
    console.error("Failed to fetch balances:", error);
    return [];
  }
}

/**
 * Get total portfolio value in USD
 */
export async function get_portfolio_value(wallet_address: string): Promise<number> {
  const balances = await get_wallet_balances(wallet_address);
  return balances.reduce((total, balance) => total + (balance.usdValue || 0), 0);
}

/**
 * Check if wallet has sufficient balance for a transaction
 */
export function has_sufficient_balance(
  balances: TokenBalance[],
  asset: string,
  amount: number
): boolean {
  const balance = balances.find(b => 
    b.assetCode === asset || b.asset === asset
  );
  
  if (!balance) return false;
  
  return parseFloat(balance.balance) >= amount;
}

/**
 * Format balance for display
 */
export function format_balance(balance: TokenBalance): string {
  const amount = parseFloat(balance.balance);
  if (amount === 0) return "0";
  
  if (amount < 0.000001) {
    return amount.toExponential(6);
  } else if (amount < 0.01) {
    return amount.toFixed(6);
  } else if (amount < 1) {
    return amount.toFixed(4);
  } else if (amount < 1000) {
    return amount.toFixed(2);
  } else {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}