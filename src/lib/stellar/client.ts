import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC || "https://soroban-testnet.stellar.org";

export const horizonServer = new Horizon.Server(HORIZON_URL);

// Soroban RPC server - simplified for now
export const sorobanServer = {
  serverURL: SOROBAN_RPC_URL,
  // We'll add actual Soroban methods as needed
  getServerURL: () => SOROBAN_RPC_URL,
};

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET"
    ? "Test SDF Network ; September 2015"
    : "Public Global Stellar Network ; September 2015";

/**
 * Get the appropriate Horizon server based on network
 */
export function getHorizonServer(): Horizon.Server {
  return horizonServer;
}

/**
 * Get the appropriate Soroban RPC server based on network
 */
export function getSorobanServer(): typeof sorobanServer {
  return sorobanServer;
}

/**
 * Check if we're on testnet
 */
export function isTestnet(): boolean {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET";
}

/**
 * Get USDC issuer address for current network
 */
export function getUSDCIssuer(): string {
  return isTestnet()
    ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" // Testnet USDC issuer
    : "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"; // Mainnet USDC issuer
}

/**
 * Get Blend pool factory contract address for current network
 */
export function getBlendPoolFactory(): string {
  return isTestnet()
    ? "CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDX6DPNA" // Testnet Blend pool factory
    : ""; // Mainnet address (to be filled)
}

/**
 * Get network display name
 */
export function getNetworkName(): string {
  return isTestnet() ? "Testnet" : "Mainnet";
}

/**
 * Format amount from stroops (1/10,000,000 of a unit) to human-readable
 */
export function fromStroops(amount: string): number {
  return parseFloat(amount) / 10000000;
}

/**
 * Format amount to stroops (1/10,000,000 of a unit)
 */
export function toStroops(amount: number): string {
  return Math.floor(amount * 10000000).toString();
}
