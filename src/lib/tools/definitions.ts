// These are the JSON schemas that tell the LLM what tools it has available
// This is what makes the AI able to call your functions

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_wallet_balances",
      description: "Get the current token balances for the connected wallet. Call this when the user asks about their portfolio, balance, or how much of a token they have.",
      parameters: {
        type: "object",
        properties: {
          wallet_address: {
            type: "string",
            description: "The Stellar wallet public key",
          },
        },
        required: ["wallet_address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_soroswap_quote",
      description: "Get a real-time swap quote from Soroswap. Call this when the user wants to swap or exchange tokens, or asks about exchange rates.",
      parameters: {
        type: "object",
        properties: {
          from_token: {
            type: "string",
            description: "Token to sell (e.g., 'XLM', 'USDC', 'BTC', 'ETH')",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          to_token: {
            type: "string",
            description: "Token to buy (e.g., 'XLM', 'USDC', 'BTC', 'ETH')",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          amount: {
            type: "string",
            description: "Amount of from_token to sell",
          },
        },
        required: ["from_token", "to_token", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_swap_tx",
      description: "Build a Soroswap swap transaction. Call this when the user confirms they want to execute a swap. Always show get_soroswap_quote first.",
      parameters: {
        type: "object",
        properties: {
          from_token: { 
            type: "string",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          to_token: { 
            type: "string",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          amount: { 
            type: "string",
            description: "Amount to swap"
          },
          slippage: {
            type: "string",
            description: "Slippage tolerance percentage (default: '0.5')",
          },
          wallet_address: { 
            type: "string",
            description: "Wallet address to build transaction for"
          },
        },
        required: ["from_token", "to_token", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_blend_pools",
      description: "Get all available Blend lending pools with current APRs and TVL. Call this when the user asks about lending, earning yield, depositing, or interest rates.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_deposit_tx",
      description: "Build a Blend lending deposit transaction. Call this when the user confirms they want to lend/deposit tokens. Always show pool APR first.",
      parameters: {
        type: "object",
        properties: {
          pool_id: {
            type: "string",
            description: "The Blend pool contract ID",
          },
          amount: {
            type: "string",
            description: "Amount to deposit",
          },
          wallet_address: { 
            type: "string",
            description: "Wallet address to build transaction for"
          },
        },
        required: ["pool_id", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "build_withdraw_tx",
      description: "Build a Blend withdrawal transaction. Call this when the user wants to withdraw their lent tokens.",
      parameters: {
        type: "object",
        properties: {
          pool_id: { 
            type: "string",
            description: "The Blend pool contract ID"
          },
          amount: { 
            type: "string",
            description: "Amount to withdraw"
          },
          wallet_address: { 
            type: "string",
            description: "Wallet address to build transaction for"
          },
        },
        required: ["pool_id", "amount", "wallet_address"],
      },
    },
  },
];

/**
 * Get tool definition by name
 */
export function get_tool_definition(name: string) {
  return TOOL_DEFINITIONS.find(tool => tool.function.name === name);
}

/**
 * Validate tool call parameters
 */
export function validate_tool_call(name: string, args: any): { valid: boolean; error?: string } {
  const tool = get_tool_definition(name);
  if (!tool) {
    return { valid: false, error: `Unknown tool: ${name}` };
  }
  
  const requiredParams = tool.function.parameters.required || [];
  for (const param of requiredParams) {
    if (!(param in args)) {
      return { valid: false, error: `Missing required parameter: ${param}` };
    }
  }
  
  return { valid: true };
}