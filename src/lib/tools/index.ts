// Re-export all tools for easy importing

export * from "./wallet";
export * from "./soroswap";
export * from "./blend";
export * from "./definitions";

// Helper function to execute any tool by name
export async function execute_tool(name: string, args: any): Promise<any> {
  // Dynamic imports to avoid circular dependencies
  switch (name) {
    case "get_wallet_balances":
      const { get_wallet_balances } = await import("./wallet");
      return await get_wallet_balances(args.wallet_address);
    
    case "get_soroswap_quote":
      const { get_soroswap_quote } = await import("./soroswap");
      return await get_soroswap_quote(args.from_token, args.to_token, args.amount);
    
    case "build_swap_tx":
      const { build_swap_tx } = await import("./soroswap");
      return await build_swap_tx(
        args.from_token,
        args.to_token,
        args.amount,
        args.slippage,
        args.wallet_address
      );
    
    case "get_blend_pools":
      const { get_blend_pools } = await import("./blend");
      return await get_blend_pools();
    
    case "build_deposit_tx":
      const { build_deposit_tx } = await import("./blend");
      return await build_deposit_tx(args.pool_id, args.amount, args.wallet_address);
    
    case "build_withdraw_tx":
      const { build_withdraw_tx } = await import("./blend");
      return await build_withdraw_tx(args.pool_id, args.amount, args.wallet_address);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Get tool descriptions for system prompt
 */
export function get_tool_descriptions(): string {
  const descriptions = [
    "get_wallet_balances: Check wallet token balances",
    "get_soroswap_quote: Get swap quotes from Soroswap",
    "build_swap_tx: Build a swap transaction",
    "get_blend_pools: See lending pools and APRs on Blend",
    "build_deposit_tx: Build a lending deposit transaction",
    "build_withdraw_tx: Build a lending withdrawal transaction",
  ];
  
  return descriptions.join("\n");
}