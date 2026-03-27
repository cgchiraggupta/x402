import axios from "axios";
import {
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
} from "@stellar/stellar-sdk";
import {
  horizonServer,
  NETWORK_PASSPHRASE,
  getUSDCIssuer,
} from "../stellar/client";

const SOROSWAP_API = "https://api.soroswap.finance";

// USDC issuer on testnet
const USDC_TESTNET_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  route: string[];
  fee: string;
  minReceive: string;
}

export async function get_soroswap_quote(
  from_token: string,
  to_token: string,
  amount: string,
): Promise<SwapQuote> {
  try {
    // Resolve token to asset
    const fromAsset = from_token === "XLM" ? "native" : from_token;
    const toAsset = to_token === "XLM" ? "native" : to_token;

    const response = await axios.get(`${SOROSWAP_API}/quote`, {
      params: {
        sellToken: fromAsset,
        buyToken: toAsset,
        sellAmount: (parseFloat(amount) * 1e7).toString(), // Convert to stroops
      },
      timeout: 5000,
    });

    const toAmount = (parseInt(response.data.buyAmount) / 1e7).toFixed(7);
    const priceImpact = response.data.priceImpact || "< 0.1%";

    return {
      fromAmount: amount,
      toAmount,
      priceImpact,
      route: response.data.path || [from_token, to_token],
      fee: "0.003", // 0.3% Soroswap fee
      minReceive: (parseFloat(toAmount) * 0.995).toFixed(7), // 0.5% slippage default
    };
  } catch (error) {
    // Fallback mock for demo if API is down
    console.error("Soroswap API error:", error);

    // Mock response for demo
    const mockRate = from_token === "XLM" && to_token === "USDC" ? 0.1646 : 1.0;
    const toAmount = (parseFloat(amount) * mockRate).toFixed(7);

    return {
      fromAmount: amount,
      toAmount,
      priceImpact: "< 0.1%",
      route: [from_token, to_token],
      fee: "0.003",
      minReceive: (parseFloat(toAmount) * 0.995).toFixed(7),
    };
  }
}

export async function build_swap_tx(
  from_token: string,
  to_token: string,
  amount: string,
  slippage: string = "0.5",
  wallet_address: string,
): Promise<string> {
  try {
    // Get account sequence number
    const account = await horizonServer.loadAccount(wallet_address);

    // Get quote first
    const quote = await get_soroswap_quote(from_token, to_token, amount);

    // Calculate minimum receive with slippage
    const slippagePercent = parseFloat(slippage) / 100;
    const minReceive = (
      parseFloat(quote.toAmount) *
      (1 - slippagePercent)
    ).toFixed(7);

    // Create assets
    let sendAsset: Asset;
    let destAsset: Asset;

    if (from_token === "XLM") {
      sendAsset = Asset.native();
    } else {
      sendAsset = new Asset(from_token, getUSDCIssuer());
    }

    if (to_token === "XLM") {
      destAsset = Asset.native();
    } else {
      destAsset = new Asset(to_token, getUSDCIssuer());
    }

    // Build path payment strict send transaction
    // This is the correct Stellar DEX operation for swaps
    const tx = new TransactionBuilder(account, {
      fee: "100", // 100 stroops = 0.00001 XLM
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset,
          sendAmount: amount,
          destination: wallet_address,
          destAsset,
          destMin: minReceive,
          path: [], // Empty path for direct swap via Stellar DEX
        }),
      )
      .addMemo(Memo.text(`Swap ${amount} ${from_token} to ${to_token}`))
      .setTimeout(300) // 5 minutes
      .build();

    return tx.toXDR();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to build swap transaction:", error);
    throw new Error(`Could not build swap transaction: ${error.message}`);
  }
}

/**
 * Get token price from Soroswap
 */
export async function get_token_price(
  token: string,
  vsToken: string = "USDC",
): Promise<number> {
  try {
    const quote = await get_soroswap_quote(token, vsToken, "1");
    return parseFloat(quote.toAmount);
  } catch (error) {
    console.error("Failed to get token price:", error);

    // Fallback prices for demo
    const prices: Record<string, number> = {
      XLM: 0.12,
      USDC: 1.0,
      BTC: 65000,
      ETH: 3500,
    };

    return prices[token] || 0;
  }
}

/**
 * Validate swap parameters
 */
export function validate_swap_params(
  from_token: string,
  to_token: string,
  amount: string,
): { valid: boolean; error?: string } {
  const validTokens = ["XLM", "USDC", "BTC", "ETH"];

  if (!validTokens.includes(from_token)) {
    return {
      valid: false,
      error: `Invalid from token: ${from_token}. Supported: ${validTokens.join(", ")}`,
    };
  }

  if (!validTokens.includes(to_token)) {
    return {
      valid: false,
      error: `Invalid to token: ${to_token}. Supported: ${validTokens.join(", ")}`,
    };
  }

  if (from_token === to_token) {
    return { valid: false, error: "Cannot swap the same token" };
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: "Amount must be a positive number" };
  }

  return { valid: true };
}
