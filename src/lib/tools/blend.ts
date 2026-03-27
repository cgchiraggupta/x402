import axios from "axios";
import {
  horizonServer,
  sorobanServer,
  NETWORK_PASSPHRASE,
  getBlendPoolFactory,
} from "../stellar/client";
import { TransactionBuilder, Memo } from "@stellar/stellar-sdk";

// Blend testnet contract addresses
const BLEND_POOL_FACTORY =
  "CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDX6DPNA";

export interface BlendPool {
  poolId: string;
  name: string;
  assets: string[];
  apr: number;
  tvl: number;
  utilization: number;
  minDeposit: number;
}

export async function get_blend_pools(): Promise<BlendPool[]> {
  try {
    // Try to fetch from Blend API if available
    const response = await axios
      .get("https://api.blend.capital/pools", {
        timeout: 5000,
      })
      .catch(() => null);

    if (response?.data) {
      return response.data.pools.map((pool: any) => ({
        poolId: pool.id,
        name: pool.name,
        assets: pool.assets,
        apr: pool.supplyApr * 100,
        tvl: pool.tvl,
        utilization: pool.utilization * 100,
        minDeposit: pool.minDeposit || 10,
      }));
    }

    // Fallback: hardcoded testnet pools for demo
    return [
      {
        poolId: "CBDMGDAT3S3T3LOCALBLENDPOOL1",
        name: "USDC-XLM Pool",
        assets: ["USDC", "XLM"],
        apr: 10.2,
        tvl: 2500000,
        utilization: 72,
        minDeposit: 10,
      },
      {
        poolId: "CBDMGDAT3S3T3LOCALBLENDPOOL2",
        name: "USDC Stable Pool",
        assets: ["USDC"],
        apr: 7.8,
        tvl: 1800000,
        utilization: 65,
        minDeposit: 10,
      },
      {
        poolId: "CBDMGDAT3S3T3LOCALBLENDPOOL3",
        name: "XLM Yield Pool",
        assets: ["XLM"],
        apr: 5.4,
        tvl: 1200000,
        utilization: 58,
        minDeposit: 100,
      },
    ];
  } catch (error) {
    console.error("Failed to fetch Blend pools:", error);

    // Return minimal fallback for demo
    return [
      {
        poolId: "DEMO_POOL_1",
        name: "USDC Lending Pool",
        assets: ["USDC"],
        apr: 8.5,
        tvl: 1500000,
        utilization: 70,
        minDeposit: 10,
      },
    ];
  }
}

export async function build_deposit_tx(
  pool_id: string,
  amount: string,
  wallet_address: string,
): Promise<string> {
  try {
    // For a real implementation, this would invoke the Blend contract
    // via Soroban SDK. For hackathon MVP, we'll create a placeholder transaction.

    const account = await horizonServer.loadAccount(wallet_address);

    // Create a placeholder transaction with memo indicating Blend deposit
    // In production, replace with actual Blend contract invocation
    const tx = new TransactionBuilder(account, {
      fee: "1000", // 0.0001 XLM
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addMemo(Memo.text(`Blend deposit: ${amount} to pool ${pool_id}`))
      .setTimeout(300)
      .build();

    return tx.toXDR();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to build deposit transaction:", error);
    throw new Error(`Could not build deposit transaction: ${error.message}`);
  }
}

export async function build_withdraw_tx(
  pool_id: string,
  amount: string,
  wallet_address: string,
): Promise<string> {
  try {
    // Similar to deposit, this would invoke Blend contract withdraw function
    const account = await horizonServer.loadAccount(wallet_address);

    const tx = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addMemo(Memo.text(`Blend withdraw: ${amount} from pool ${pool_id}`))
      .setTimeout(300)
      .build();

    return tx.toXDR();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to build withdrawal transaction:", error);
    throw new Error(`Could not build withdrawal transaction: ${error.message}`);
  }
}

/**
 * Find the best pool for a given token
 */
export function find_best_pool(
  pools: BlendPool[],
  token: string,
): BlendPool | null {
  const eligiblePools = pools.filter(
    (pool) =>
      pool.assets.includes(token) &&
      parseFloat(pool.utilization.toString()) < 90, // Avoid over-utilized pools
  );

  if (eligiblePools.length === 0) return null;

  // Sort by APR descending
  return eligiblePools.sort((a, b) => b.apr - a.apr)[0];
}

/**
 * Calculate expected earnings
 */
export function calculate_expected_earnings(
  amount: number,
  apr: number,
  days: number = 30,
): number {
  const dailyRate = apr / 365 / 100;
  return amount * dailyRate * days;
}

/**
 * Validate deposit parameters
 */
export function validate_deposit_params(
  pool: BlendPool,
  amount: string,
): { valid: boolean; error?: string } {
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: "Amount must be a positive number" };
  }

  if (amountNum < pool.minDeposit) {
    return { valid: false, error: `Minimum deposit is ${pool.minDeposit}` };
  }

  if (pool.utilization >= 95) {
    return { valid: false, error: "Pool is nearly full (95%+ utilization)" };
  }

  return { valid: true };
}
