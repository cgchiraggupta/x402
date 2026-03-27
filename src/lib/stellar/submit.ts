import { horizonServer } from "./client";
import { TransactionBuilder } from "@stellar/stellar-sdk";

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
  ledger?: number;
}

export async function submitTransaction(signedXDR: string): Promise<TransactionResult> {
  try {
    // Parse the signed transaction
    const transaction = TransactionBuilder.fromXDR(
      signedXDR,
      horizonServer.serverURL
    );
    
    // Submit to Stellar network
    const result = await horizonServer.submitTransaction(transaction as any);
    
    return {
      hash: result.hash,
      success: true,
      ledger: result.ledger,
    };
  } catch (error: any) {
    console.error("Transaction submission failed:", error);
    
    // Extract error details from Stellar response
    let errorMessage = "Transaction failed";
    
    if (error?.response?.data) {
      const data = error.response.data;
      if (data.extras?.result_codes?.transaction) {
        errorMessage = `Transaction failed: ${data.extras.result_codes.transaction}`;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.title) {
        errorMessage = data.title;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      hash: "",
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check transaction status
 */
export async function checkTransactionStatus(hash: string): Promise<{
  success: boolean;
  confirmed: boolean;
  ledger?: number;
  error?: string;
}> {
  try {
    const transaction = await horizonServer.transactions().transaction(hash).call();
    
    return {
      success: transaction.successful,
      confirmed: true,
      ledger: transaction.ledger,
    };
  } catch (error: any) {
    // Transaction might not be found yet
    if (error?.response?.status === 404) {
      return {
        success: false,
        confirmed: false,
        error: "Transaction not found yet",
      };
    }
    
    return {
      success: false,
      confirmed: false,
      error: error.message || "Failed to check transaction status",
    };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransactionConfirmation(
  hash: string,
  timeoutMs: number = 30000,
  pollIntervalMs: number = 1000
): Promise<{
  success: boolean;
  confirmed: boolean;
  ledger?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = await checkTransactionStatus(hash);
    
    if (status.confirmed) {
      return status;
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  return {
    success: false,
    confirmed: false,
    error: "Transaction confirmation timeout",
  };
}

/**
 * Get transaction explorer URL
 */
export function getTransactionExplorerUrl(hash: string): string {
  const isTestnet = horizonServer.serverURL.includes("testnet");
  const baseUrl = isTestnet 
    ? "https://stellar.expert/explorer/testnet/tx"
    : "https://stellar.expert/explorer/public/tx";
  
  return `${baseUrl}/${hash}`;
}

/**
 * Get account explorer URL
 */
export function getAccountExplorerUrl(address: string): string {
  const isTestnet = horizonServer.serverURL.includes("testnet");
  const baseUrl = isTestnet 
    ? "https://stellar.expert/explorer/testnet/account"
    : "https://stellar.expert/explorer/public/account";
  
  return `${baseUrl}/${address}`;
}