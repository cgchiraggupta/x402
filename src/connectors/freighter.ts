import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
  getNetwork,
} from "@stellar/freighter-api";

/**
 * Check if Freighter wallet is installed and available
 * @returns Promise<boolean> True if Freighter is installed and connected
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Connect to Freighter wallet and get public key
 * @returns Promise<string | null> Public key if successful, null if failed
 */
export async function connectFreighter(): Promise<string | null> {
  try {
    const { isAllowed: allowed } = await isAllowed();
    if (!allowed) {
      await requestAccess();
    }
    const { address } = await getAddress();
    return address;
  } catch (error) {
    console.error("Failed to connect Freighter:", error);
    return null;
  }
}

/**
 * Sign a transaction XDR with Freighter wallet
 * @param xdr - Transaction XDR to sign
 * @param network - Network to use (default: "TESTNET")
 * @returns Promise<string | null> Signed XDR if successful, null if failed
 */
export async function signXDR(
  xdr: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET",
): Promise<string | null> {
  try {
    const networkPassphrase =
      network === "PUBLIC"
        ? "Public Global Stellar Network ; September 2015"
        : "Test SDF Network ; September 2015";

    const result = await signTransaction(xdr, {
      networkPassphrase,
    });
    return result.signedTxXdr;
  } catch (error) {
    console.error("User rejected or sign failed:", error);
    return null;
  }
}

/**
 * Get current network from Freighter
 * @returns Promise<"TESTNET" | "PUBLIC" | null> Current network or null if failed
 */
export async function getCurrentNetwork(): Promise<
  "TESTNET" | "PUBLIC" | null
> {
  try {
    const result = await getNetwork();
    return result.network as "TESTNET" | "PUBLIC";
  } catch (error) {
    console.error("Failed to get network from Freighter:", error);
    return null;
  }
}

/**
 * Check if wallet is connected and get public key
 * @returns Promise<{ isConnected: boolean; publicKey: string | null }>
 */
export async function getWalletStatus(): Promise<{
  isConnected: boolean;
  publicKey: string | null;
}> {
  try {
    const isInstalled = await checkFreighterInstalled();
    if (!isInstalled) {
      return { isConnected: false, publicKey: null };
    }

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) {
      return { isConnected: false, publicKey: null };
    }

    const addressResult = await getAddress();
    return { isConnected: true, publicKey: addressResult.address };
  } catch (error) {
    console.error("Failed to get wallet status:", error);
    return { isConnected: false, publicKey: null };
  }
}

/**
 * Complete wallet connection flow
 * @returns Promise<{ success: boolean; publicKey: string | null; error?: string }>
 */
export async function completeWalletConnection(): Promise<{
  success: boolean;
  publicKey: string | null;
  error?: string;
}> {
  try {
    // Check if Freighter is installed
    const isInstalled = await checkFreighterInstalled();
    if (!isInstalled) {
      return {
        success: false,
        publicKey: null,
        error: "Freighter wallet not installed. Please install it first.",
      };
    }

    // Request access if not allowed
    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) {
      await requestAccess();
    }

    // Get public key
    const { address } = await getAddress();
    if (!address) {
      return {
        success: false,
        publicKey: null,
        error: "Failed to get public key from Freighter.",
      };
    }

    return { success: true, publicKey: address, error: undefined };
  } catch (error: any) {
    console.error("Wallet connection failed:", error);
    return {
      success: false,
      publicKey: null,
      error: error.message || "Unknown error during wallet connection",
    };
  }
}

/**
 * Disconnect wallet (client-side only - Freighter doesn't have a disconnect method)
 * This just clears local state
 */
export function disconnectWallet(): void {
  // Freighter doesn't have a disconnect method
  // This function is for consistency with other wallet connectors
  console.log("Wallet disconnected (client state cleared)");
}

/**
 * Wallet connector interface for consistency with other wallets
 */
export const FreighterConnector = {
  checkInstalled: checkFreighterInstalled,
  connect: connectFreighter,
  signTransaction: signXDR,
  getNetwork: getCurrentNetwork,
  getStatus: getWalletStatus,
  completeConnection: completeWalletConnection,
  disconnect: disconnectWallet,
};

export default FreighterConnector;
