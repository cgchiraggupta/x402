import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { TOOL_DEFINITIONS, get_tool_descriptions } from "@/lib/tools/definitions";
import {
  get_wallet_balances,
  get_soroswap_quote,
  build_swap_tx,
  get_blend_pools,
  build_deposit_tx,
  build_withdraw_tx,
} from "@/lib/tools";

// Configure DeepSeek instead of OpenAI
const openai = new OpenAI({ 
  baseURL: "https://api.deepseek.com", 
  apiKey: process.env.DEEPSEEK_API_KEY 
});

const SYSTEM_PROMPT = `You are a DeFi assistant for the Stellar blockchain named "StarDeFi". 

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
- When a transaction is ready, say: "Ready to execute. Approve in your wallet."

Safety rules:
- NEVER build a transaction without the user's explicit intent
- Always show what the transaction will do BEFORE building it
- If the user asks for something risky, explain the risk clearly
- Never recommend putting more than they can afford to lose

Current network: Stellar Testnet`;

export async function POST(req: NextRequest) {
  try {
    const { messages, walletAddress, balances } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    
    // Inject wallet context into system
    const systemWithContext = `${SYSTEM_PROMPT}

Connected wallet: ${walletAddress}
Current balances: ${balances ? JSON.stringify(balances) : "Unknown"}`;

    let openaiMessages = [
      { role: "system" as const, content: systemWithContext },
      ...messages,
    ];
    
    let pendingXDR: string | null = null;
    let transactionDetails: any = null;

    // Agentic loop — AI can call multiple tools in sequence (max 5 iterations)
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: openaiMessages,
        tools: TOOL_DEFINITIONS as any,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      });

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
        const { name, arguments: argsStr } = toolCall.function;
        const args = JSON.parse(argsStr);
        
        let result: any;
        
        try {
          switch (name) {
            case "get_wallet_balances":
              result = await get_wallet_balances(args.wallet_address || walletAddress);
              break;
              
            case "get_soroswap_quote":
              result = await get_soroswap_quote(args.from_token, args.to_token, args.amount);
              break;
              
            case "build_swap_tx":
              const swapXDR = await build_swap_tx(
                args.from_token,
                args.to_token,
                args.amount,
                args.slippage || "0.5",
                args.wallet_address || walletAddress
              );
              pendingXDR = swapXDR;
              transactionDetails = {
                type: "swap",
                from: args.from_token,
                to: args.to_token,
                amount: args.amount,
                slippage: args.slippage || "0.5",
              };
              result = { 
                xdr: "Transaction built successfully", 
                ready: true,
                details: transactionDetails
              };
              break;
              
            case "get_blend_pools":
              result = await get_blend_pools();
              break;
              
            case "build_deposit_tx":
              const depositXDR = await build_deposit_tx(
                args.pool_id,
                args.amount,
                args.wallet_address || walletAddress
              );
              pendingXDR = depositXDR;
              transactionDetails = {
                type: "deposit",
                poolId: args.pool_id,
                amount: args.amount,
              };
              result = { 
                xdr: "Transaction built successfully", 
                ready: true,
                details: transactionDetails
              };
              break;
              
            case "build_withdraw_tx":
              const withdrawXDR = await build_withdraw_tx(
                args.pool_id,
                args.amount,
                args.wallet_address || walletAddress
              );
              pendingXDR = withdrawXDR;
              transactionDetails = {
                type: "withdraw",
                poolId: args.pool_id,
                amount: args.amount,
              };
              result = { 
                xdr: "Transaction built successfully", 
                ready: true,
                details: transactionDetails
              };
              break;
              
            default:
              result = { error: "Unknown tool" };
          }
        } catch (err: any) {
          console.error(`Tool execution error for ${name}:`, err);
          result = { error: err.message || "Tool execution failed" };
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
      message: "I encountered an issue processing your request. Please try again with a simpler command.",
      pendingXDR: null,
      transactionDetails: null,
    });
    
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";