// These are the JSON schemas that tell the LLM what tools it has available
// This is what makes the AI able to call your functions

/* eslint-disable @typescript-eslint/no-explicit-any */
export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "get_wallet_balances",
      description: "Get the current token balances for the connected wallet. Call this when the user asks about their portfolio, balance, or how much of a token they have.",
      parameters: {
        type: "object" as const,
        properties: {
          wallet_address: {
            type: "string" as const,
            description: "The Stellar wallet public key",
          },
        },
        required: ["wallet_address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_soroswap_quote",
      description: "Get a real-time swap quote from Soroswap. Call this when the user wants to swap or exchange tokens, or asks about exchange rates.",
      parameters: {
        type: "object" as const,
        properties: {
          from_token: {
            type: "string" as const,
            description: "Token to sell (e.g., 'XLM', 'USDC', 'BTC', 'ETH')",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          to_token: {
            type: "string" as const,
            description: "Token to buy (e.g., 'XLM', 'USDC', 'BTC', 'ETH')",
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          amount: {
            type: "string" as const,
            description: "Amount of from_token to sell",
          },
        },
        required: ["from_token", "to_token", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "build_swap_tx",
      description: "Build a Soroswap swap transaction. Call this when the user confirms they want to execute a swap. Always show get_soroswap_quote first.",
      parameters: {
        type: "object" as const,
        properties: {
          from_token: {
            type: "string" as const,
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          to_token: {
            type: "string" as const,
            enum: ["XLM", "USDC", "BTC", "ETH"],
          },
          amount: {
            type: "string" as const,
            description: "Amount to swap"
          },
          slippage: {
            type: "string" as const,
            description: "Slippage tolerance percentage (default: '0.5')",
          },
          wallet_address: {
            type: "string" as const,
            description: "Wallet address to build transaction for"
          },
        },
        required: ["from_token", "to_token", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_blend_pools",
      description: "Get all available Blend lending pools with current APRs and TVL. Call this when the user asks about lending, earning yield, depositing, or interest rates.",
      parameters: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "build_deposit_tx",
      description: "Build a Blend lending deposit transaction. Call this when the user confirms they want to lend/deposit tokens. Always show pool APR first.",
      parameters: {
        type: "object" as const,
        properties: {
          pool_id: {
            type: "string" as const,
            description: "The Blend pool contract ID",
          },
          amount: {
            type: "string" as const,
            description: "Amount to deposit",
          },
          wallet_address: {
            type: "string" as const,
            description: "Wallet address to build transaction for"
          },
        },
        required: ["pool_id", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "build_withdraw_tx",
      description: "Build a Blend withdrawal transaction. Call this when the user wants to withdraw their lent tokens.",
      parameters: {
        type: "object" as const,
        properties: {
          pool_id: {
            type: "string" as const,
            description: "The Blend pool contract ID"
          },
          amount: {
            type: "string" as const,
            description: "Amount to withdraw"
          },
          wallet_address: {
            type: "string" as const,
            description: "Wallet address to build transaction for"
          },
        },
        required: ["pool_id", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_x402_feeds",
      description: "Get available premium data feeds from x402 protocol. x402 is a Stellar protocol that lets AI agents pay for data autonomously using USDC micropayments. Use this when user asks about premium data or wants better information.",
      parameters: {
        type: "object" as const,
        properties: {
          // No parameters needed for listing feeds
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pay_for_data",
      description: "Pay for premium data using x402 protocol. The AI autonomously pays for data using USDC micropayments. This demonstrates true AI agent capability - the AI can spend money to get better information. Use when user wants premium data or better analytics.",
      parameters: {
        type: "object" as const,
        properties: {
          query: {
            type: "string" as const,
            description: "The data query (e.g., 'XLM price premium feed', 'DeFi analytics', 'market sentiment')"
          },
          amount: {
            type: "string" as const,
            description: "Amount of USDC to pay (will be deducted from wallet)"
          },
          wallet_address: {
            type: "string" as const,
            description: "Wallet address to charge for the data"
          },
        },
        required: ["query", "amount", "wallet_address"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "subscribe_to_feed",
      description: "Subscribe to a recurring data feed using x402 protocol. Sets up automatic payments for regular data updates.",
      parameters: {
        type: "object" as const,
        properties: {
          feed_id: {
            type: "string" as const,
            description: "ID of the feed to subscribe to"
          },
          duration: {
            type: "string" as const,
            description: "Subscription duration (e.g., '1d', '7d', '30d')"
          },
          wallet_address: {
            type: "string" as const,
            description: "Wallet address to charge for subscription"
          },
        },
        required: ["feed_id", "duration", "wallet_address"],
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
 * Get human-readable descriptions of all tools for the system prompt
 */
export function get_tool_descriptions(): string {
  return TOOL_DEFINITIONS.map(tool => {
    const func = tool.function;
    const params = Object.entries(func.parameters.properties || {})
      .map(([name, prop]: [string, any]) => {
        const type = prop.enum ? `(${prop.enum.join('|')})` : prop.type;
        return `  - ${name}: ${type}${prop.description ? ` - ${prop.description}` : ''}`;
      })
      .join('\n');

    return `${func.name}: ${func.description}\n${params}`;
  }).join('\n\n');
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