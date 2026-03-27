import axios from "axios";
import {
  TransactionBuilder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Networks,
  Operation,
  Asset,
  Memo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Keypair,
} from "@stellar/stellar-sdk";
import {
  horizonServer,
  NETWORK_PASSPHRASE,
  getUSDCIssuer,
} from "../stellar/client";

// x402 protocol testnet contract address
const X402_CONTRACT_ADDRESS =
  "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE";

// x402 API endpoints (simulated for demo - real API would be different)
const X402_API_BASE = "https://api.x402.org/testnet";

export interface DataFeed {
  id: string;
  name: string;
  description: string;
  price: number; // USDC per query
  updateFrequency: string;
  provider: string;
}

export interface DataQueryResult {
  query: string;
  result: any;
  pricePaid: number;
  timestamp: string;
  transactionHash?: string;
}

/**
 * Get available data feeds from x402 protocol
 */
export async function get_x402_feeds(): Promise<DataFeed[]> {
  try {
    // Try to fetch from x402 API
    const response = await axios
      .get(`${X402_API_BASE}/feeds`, {
        timeout: 5000,
      })
      .catch(() => null);

    if (response?.data) {
      return response.data.feeds;
    }

    // Fallback: demo data feeds
    return [
      {
        id: "xlm_price_premium",
        name: "XLM Premium Price Feed",
        description:
          "Real-time XLM/USD price with 99.9% accuracy, 100ms updates",
        price: 0.01, // 0.01 USDC per query
        updateFrequency: "100ms",
        provider: "CoinMetrics",
      },
      {
        id: "defi_analytics",
        name: "DeFi Analytics Dashboard",
        description: "TVL, volume, APR across all Stellar DeFi protocols",
        price: 0.05,
        updateFrequency: "1h",
        provider: "DefiLlama",
      },
      {
        id: "market_sentiment",
        name: "Crypto Market Sentiment",
        description: "Social media sentiment analysis for top 100 tokens",
        price: 0.02,
        updateFrequency: "15m",
        provider: "LunarCrush",
      },
      {
        id: "arbitrage_opportunities",
        name: "Cross-DEX Arbitrage",
        description:
          "Real-time arbitrage opportunities across Soroswap, Phoenix, StellarX",
        price: 0.1,
        updateFrequency: "30s",
        provider: "ArbBot",
      },
    ];
  } catch (error) {
    console.error("Failed to fetch x402 feeds:", error);
    throw new Error("Could not fetch data feeds");
  }
}

/**
 * Get price for a specific data query
 */
export async function get_x402_price(query: string): Promise<number> {
  try {
    // In real implementation, would call x402 contract
    // For demo, use fixed prices based on query type

    if (
      query.includes("price") ||
      query.includes("XLM") ||
      query.includes("USDC")
    ) {
      return 0.01; // 0.01 USDC for price data
    }

    if (
      query.includes("analytics") ||
      query.includes("TVL") ||
      query.includes("volume")
    ) {
      return 0.05; // 0.05 USDC for analytics
    }

    if (query.includes("sentiment") || query.includes("social")) {
      return 0.02; // 0.02 USDC for sentiment
    }

    return 0.01; // Default price
  } catch (error) {
    console.error("Failed to get x402 price:", error);
    return 0.01; // Fallback price
  }
}

/**
 * Pay for and execute a data query using x402 protocol
 */
export async function pay_for_data(
  query: string,
  amount: string,
  walletAddress: string,
): Promise<DataQueryResult> {
  try {
    const price = await get_x402_price(query);
    const amountNum = parseFloat(amount);

    if (amountNum < price) {
      throw new Error(
        `Insufficient payment. Required: ${price} USDC, provided: ${amount}`,
      );
    }

    // In real implementation:
    // 1. Build transaction to x402 contract
    // 2. Include payment (amount USDC)
    // 3. Include query as memo
    // 4. Submit to network
    // 5. Wait for callback with data

    // For demo, simulate the transaction and return mock data
    console.log(`[x402] Paying ${price} USDC for query: "${query}"`);

    // Simulate transaction building
    const account = await horizonServer.loadAccount(walletAddress);
    const usdcAsset = new Asset("USDC", getUSDCIssuer());

    const tx = new TransactionBuilder(account, {
      fee: "100", // 100 stroops = 0.00001 XLM
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: X402_CONTRACT_ADDRESS,
          asset: usdcAsset,
          amount: price.toFixed(7), // USDC amount
        }),
      )
      .addMemo(Memo.text(`x402_query:${query}`))
      .setTimeout(300)
      .build();

    const xdr = tx.toXDR();

    // Simulate data response based on query
    const result = await simulate_data_query(query);

    return {
      query,
      result,
      pricePaid: price,
      timestamp: new Date().toISOString(),
      transactionHash: `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error: any) {
    console.error("Failed to pay for data:", error);
    throw new Error(`x402 payment failed: ${error.message}`);
  }
}

/**
 * Subscribe to a data feed (recurring payments)
 */
export async function subscribe_to_feed(
  feedId: string,
  duration: string, // e.g., "1d", "7d", "30d"
  walletAddress: string,
): Promise<{
  success: boolean;
  subscriptionId: string;
  cost: number;
  expiresAt: string;
}> {
  try {
    const feeds = await get_x402_feeds();
    const feed = feeds.find((f) => f.id === feedId);

    if (!feed) {
      throw new Error(`Feed ${feedId} not found`);
    }

    // Calculate cost based on duration
    const durationDays = parseDuration(duration);
    const cost = feed.price * durationDays * 24; // Assuming hourly updates

    // In real implementation: create recurring payment contract
    console.log(
      `[x402] Subscribing to ${feedId} for ${duration} at ${cost} USDC`,
    );

    return {
      success: true,
      subscriptionId: `sub_${feedId}_${Date.now()}`,
      cost,
      expiresAt: new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  } catch (error: any) {
    console.error("Failed to subscribe to feed:", error);
    throw new Error(`Subscription failed: ${error.message}`);
  }
}

/**
 * Simulate data query results (for demo)
 */
async function simulate_data_query(query: string): Promise<any> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const queryLower = query.toLowerCase();

  if (queryLower.includes("xlm") && queryLower.includes("price")) {
    return {
      symbol: "XLM",
      price: 0.1245,
      change24h: 2.34,
      volume24h: 125000000,
      marketCap: 3500000000,
      source: "CoinMetrics Premium Feed",
      timestamp: new Date().toISOString(),
    };
  }

  if (queryLower.includes("defi") || queryLower.includes("tvl")) {
    return {
      totalTVL: 285000000,
      protocols: [
        { name: "Blend", tvl: 125000000, change24h: 1.2 },
        { name: "Soroswap", tvl: 85000000, change24h: 3.4 },
        { name: "Phoenix", tvl: 45000000, change24h: -0.5 },
        { name: "StellarX", tvl: 30000000, change24h: 0.8 },
      ],
      source: "DefiLlama Enterprise API",
      timestamp: new Date().toISOString(),
    };
  }

  if (queryLower.includes("sentiment")) {
    return {
      overallSentiment: 0.72, // 0-1 scale
      sentimentChange24h: 0.08,
      socialVolume: 12500,
      topMentions: ["XLM", "USDC", "BTC"],
      fearGreedIndex: 65,
      source: "LunarCrush Social Analytics",
      timestamp: new Date().toISOString(),
    };
  }

  if (queryLower.includes("arbitrage")) {
    return {
      opportunities: [
        {
          pair: "XLM/USDC",
          dex1: "Soroswap",
          dex2: "Phoenix",
          spread: 0.42, // 0.42%
          estimatedProfit: 125, // USDC
          risk: "low",
        },
        {
          pair: "USDC/BTC",
          dex1: "StellarX",
          dex2: "Soroswap",
          spread: 0.18,
          estimatedProfit: 85,
          risk: "medium",
        },
      ],
      source: "ArbBot Pro",
      timestamp: new Date().toISOString(),
    };
  }

  // Default response
  return {
    query,
    result: "Data retrieved successfully via x402 protocol",
    note: "This data was paid for autonomously by the AI using USDC micropayments",
    source: "x402 Protocol",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse duration string to days
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) return 1;

  const [, amount, unit] = match;
  const num = parseInt(amount);

  switch (unit) {
    case "d":
      return num;
    case "h":
      return num / 24;
    case "m":
      return num / (24 * 60);
    default:
      return 1;
  }
}

/**
 * Check x402 subscription status
 */
export async function check_subscription_status(
  subscriptionId: string,
  walletAddress: string,
): Promise<{
  active: boolean;
  feedId: string;
  expiresAt: string;
  queriesUsed: number;
  costSoFar: number;
}> {
  // For demo, return mock status
  return {
    active: true,
    feedId: subscriptionId.split("_")[1],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    queriesUsed: 42,
    costSoFar: 0.42,
  };
}
