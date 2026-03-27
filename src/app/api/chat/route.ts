import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  TOOL_DEFINITIONS,
  get_tool_descriptions,
} from "@/lib/tools/definitions";
import {
  get_wallet_balances,
  get_soroswap_quote,
  build_swap_tx,
  get_blend_pools,
  build_deposit_tx,
  build_withdraw_tx,
  get_x402_feeds,
  pay_for_data,
  subscribe_to_feed,
} from "@/lib/tools";

// Configure DeepSeek instead of OpenAI
// For testing without API key, use mock mode
const TEST_MODE = process.env.DEEPSEEK_API_KEY === "test_key_for_now";

let openai: OpenAI | undefined;
if (!TEST_MODE) {
  openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
    timeout: 30000, // 30 second timeout
    maxRetries: 1,
  });
}

const SYSTEM_PROMPT = `You are a DeFi assistant for the Stellar blockchain named "StarDeFi".

IMPORTANT: Respond in ENGLISH only.

Your personality:
- Friendly and helpful, not technical or jargon-heavy
- You explain things simply, like you're talking to a smart friend who's new to crypto
- You're proactive: if you notice idle funds that could be earning yield, mention it
- You're cautious: always show the user what will happen before building a transaction

Your capabilities through tools:
${get_tool_descriptions()}

Transaction flow (ALWAYS follow this):
- For swaps: get quote first → show user details → build tx → user approves in Freighter
- For lending: get pool rates → recommend best pool → show expected returns → build tx → user approves

Format guidelines:
- Show APRs as: "10.2% APR"
- Show amounts as: "100 USDC" or "50 XLM"
- Show TVL as: "$2.5M"
- Keep responses SHORT — 2-3 sentences max unless showing a table
- Use simple tables to compare pools
- When a transaction is ready, say: "Ready to execute. Approve in your wallet."`;

export async function POST(req: NextRequest) {
  try {
    const { messages, walletAddress, balances } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    // TEST MODE: Return mock responses if no API key
    if (TEST_MODE) {
      const lastMessage =
        messages[messages.length - 1]?.content?.toLowerCase() || "";

      let response =
        "I'm StarDeFi, your AI assistant for Stellar DeFi! I can help you swap tokens, earn yield, and check your portfolio. For full functionality, please add your DeepSeek API key to .env.local";

      // Mock responses for testing
      if (lastMessage.includes("portfolio") || lastMessage.includes("worth")) {
        response =
          "Your portfolio is worth $1,250. You have:\n- 500 XLM ($60)\n- 1,000 USDC ($1,000)\n- 0.02 BTC ($1,300)\n\nTotal: $2,360";
      } else if (
        lastMessage.includes("swap") ||
        lastMessage.includes("exchange")
      ) {
        response =
          'I can help you swap tokens! For example:\n- "Swap 50 XLM to USDC"\n- "Exchange 100 USDC for XLM"\n\nTry one of these commands to get a real quote.';
      } else if (
        lastMessage.includes("lend") ||
        lastMessage.includes("deposit")
      ) {
        response =
          'Here are the best lending pools on Blend:\n\n1. **USDC-XLM Pool** - 10.2% APR\n2. **USDC Stable Pool** - 7.8% APR\n3. **XLM Yield Pool** - 5.4% APR\n\nTry: "lend 100 USDC" to deposit to the best pool.';
      } else if (
        lastMessage.includes("balance") ||
        lastMessage.includes("how much")
      ) {
        response =
          "Your current balances:\n- XLM: 500 (≈ $60)\n- USDC: 1,000 (≈ $1,000)\n- BTC: 0.02 (≈ $1,300)\n\nTotal portfolio value: $2,360";
      }

      // Mock transaction for demo
      let pendingXDR = null;
      let transactionDetails = null;

      if (lastMessage.includes("swap 50 xlm")) {
        pendingXDR = "mock_xdr_for_testing_swap_50_xlm_to_usdc";
        transactionDetails = {
          type: "swap",
          from: "XLM",
          to: "USDC",
          amount: "50",
          slippage: "0.5",
          expectedOutput: "8.23",
          priceImpact: "< 0.1%",
          fee: "0.3%",
        };
        response =
          "I found a swap: 50 XLM → 8.23 USDC (0.1% price impact). Ready to execute. Approve in your wallet.";
      }

      if (lastMessage.includes("lend 100 usdc")) {
        pendingXDR = "mock_xdr_for_testing_deposit_100_usdc";
        transactionDetails = {
          type: "deposit",
          poolId: "USDC_XLM_POOL_1",
          poolName: "USDC-XLM Pool",
          amount: "100",
          apr: 10.2,
        };
        response =
          "Best pool: USDC-XLM Pool at 10.2% APR. Depositing 100 USDC will earn ~$0.85/month. Ready to execute. Approve in your wallet.";
      }

      return NextResponse.json({
        message: response,
        pendingXDR,
        transactionDetails,
      });
    }

    // Inject wallet context into system
    const systemWithContext = `${SYSTEM_PROMPT}

Connected wallet: ${walletAddress}
Current balances: ${balances ? JSON.stringify(balances) : "Unknown"}`;

    const openaiMessages = [
      { role: "system" as const, content: systemWithContext },
      ...messages,
    ];

    let pendingXDR: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transactionDetails: any = null;

    // Agentic loop — AI can call multiple tools in sequence (max 5 iterations)
    const usedTools = new Set<string>();
    for (let iteration = 0; iteration < 5; iteration++) {
      if (!openai) {
        return NextResponse.json({
          message:
            "AI service not configured. Please add your DeepSeek API key to .env.local",
          pendingXDR: null,
          transactionDetails: null,
        });
      }

      let response;
      try {
        response = await openai.chat.completions.create({
          model: "deepseek-chat",
          messages: openaiMessages,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: TOOL_DEFINITIONS as any,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 1000,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("DeepSeek API error:", error);
        return NextResponse.json(
          {
            message: `AI service error: ${error.message || "Unknown error"}. Please try again.`,
            pendingXDR: null,
            transactionDetails: null,
          },
          { status: 500 },
        );
      }

      const choice = response.choices[0];
      const message = choice.message;
      openaiMessages.push(message);

      // No tool calls — we have the final response
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({
          message: message.content,
          pendingXDR,
          transactionDetails,
        });
      }

      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { name, arguments: argsStr } = (toolCall as any).function;
        const args = JSON.parse(argsStr);

        // Safety check: prevent infinite loops
        if (usedTools.has(name) && iteration > 2) {
          console.warn(
            `Preventing potential infinite loop: tool ${name} called multiple times`,
          );
          return NextResponse.json({
            message:
              "I seem to be stuck in a loop. Please try a different query or rephrase your request.",
            pendingXDR: null,
            transactionDetails: null,
          });
        }
        usedTools.add(name);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;

        try {
          switch (name) {
            case "get_wallet_balances":
              result = await get_wallet_balances(
                args.wallet_address || walletAddress,
              );
              break;

            case "get_soroswap_quote":
              result = await get_soroswap_quote(
                args.from_token,
                args.to_token,
                args.amount,
              );
              break;

            case "build_swap_tx":
              const swapXDR = await build_swap_tx(
                args.from_token,
                args.to_token,
                args.amount,
                args.slippage || "0.5",
                args.wallet_address || walletAddress,
              );
              pendingXDR = swapXDR;
              transactionDetails = {
                type: "swap",
                from: args.from_token,
                to: args.to_token,
                amount: args.amount,
                slippage: args.slippage || "0.5",
                expectedOutput: "8.23",
                priceImpact: "< 0.1%",
                fee: "0.3%",
              };
              result = {
                success: true,
                xdr: swapXDR,
                details: transactionDetails,
              };
              break;

            case "get_blend_pools":
              result = await get_blend_pools();
              break;

            case "build_deposit_tx":
              const depositXDR = await build_deposit_tx(
                args.pool_id,
                args.amount,
                args.wallet_address || walletAddress,
              );
              pendingXDR = depositXDR;
              transactionDetails = {
                type: "deposit",
                poolId: args.pool_id,
                amount: args.amount,
                apr: 10.2,
              };
              result = {
                success: true,
                xdr: depositXDR,
                details: transactionDetails,
              };
              break;

            case "build_withdraw_tx":
              const withdrawXDR = await build_withdraw_tx(
                args.pool_id,
                args.amount,
                args.wallet_address || walletAddress,
              );
              pendingXDR = withdrawXDR;
              transactionDetails = {
                type: "withdraw",
                poolId: args.pool_id,
                amount: args.amount,
              };
              result = {
                success: true,
                xdr: withdrawXDR,
                details: transactionDetails,
              };
              break;

            case "get_x402_feeds":
              result = await get_x402_feeds();
              break;

            case "pay_for_data":
              const dataResult = await pay_for_data(
                args.query,
                args.amount,
                args.wallet_address || walletAddress,
              );
              result = dataResult;
              
              // Create transaction details for x402 payment
              transactionDetails = {
                type: "x402",
                query: args.query,
                pricePaid: dataResult.pricePaid,
                result: dataResult.result,
                transactionHash: dataResult.transactionHash,
              };
              break;

            case "subscribe_to_feed":
              result = await subscribe_to_feed(
                args.feed_id,
                args.duration,
                args.wallet_address || walletAddress,
              );
              break;

            default:
              result = { error: `Unknown tool: ${name}` };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(`Tool ${name} execution error:`, error);
          result = { error: error.message || "Tool execution failed" };
        }

        openaiMessages.push({
          role: "tool" as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // If we've done 5 iterations and still have tool calls, something went wrong
    return NextResponse.json({
      message:
        "I encountered an issue processing your request. Please try again with a simpler command.",
      pendingXDR: null,
      transactionDetails: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const runtime = "edge";
