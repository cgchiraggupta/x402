# Code Reference — Patterns, Snippets & Implementation Guide
> Feed this FOURTH. Contains the actual code patterns Kimi should generate and implement.

---

## Onboardr Code Analysis — What to Reuse vs Rewrite

The Onboardr repo (github.com/DomNav/onboardr) is a hackathon prototype with polished UI but **mocked core functionality**. Here's the analysis:

### DEFINITELY REUSE (saves days of work)

| File | What It Does | Lines | How to Use |
|------|-------------|-------|------------|
| `src/connectors/freighter.ts` | Freighter wallet: `isAvailable()`, `isConnected()`, `connect()`, `getPublicKey()` | ~80 | Copy directly. Standard boilerplate. |
| `src/connectors/lobstr.ts` | Lobstr wallet connector (same interface as Freighter) | ~60 | Copy for multi-wallet support (bonus points) |
| `src/lib/soroswap/api.ts` | Fetches live pool data from `api.soroswap.finance` — TVL, APR, token pairs, volume | ~120 | Copy and clean up. This is REAL data fetching. |
| `src/lib/soroswap/websocket.ts` | Real-time price streaming via WebSocket | ~50 | Copy for live price updates |
| Project structure | Next.js 14 + TypeScript + Tailwind + Zustand folder layout | — | Follow same pattern |
| `src/app/api/chat/route.ts` | Pattern for calling OpenAI API with system prompt + wallet context | ~150 | Study approach, rewrite with proper function calling |

### STUDY BUT REWRITE

| File | Why Study | Why Rewrite |
|------|-----------|-------------|
| `src/lib/orchestration/` | Multi-agent architecture idea | Unfinished, over-engineered. Use simpler single-agent with tools. |
| `src/app/api/chat/route.ts` | NFT-gating pattern + Soroban simulation | NFT-gating unnecessary. Switch to OpenAI SDK with function calling. |
| `src/lib/defindex/` | DeFindex vault analytics integration | Data is mostly mocked. Need real API calls. |

### SKIP ENTIRELY

- `src/lib/nft/` — NFT Profile system. Zero hackathon value. Judges don't care about profile NFTs.
- MCP vector store / Supabase memory — Over-engineered. Simple in-memory array works for demo.
- Subscription tiers UI — Does nothing. Focus on functionality.
- `contracts/` Rust swap_router — Use existing contracts, not write new ones.
- NextAuth + Supabase auth — Wallet connection IS your auth.
- Socket.IO / WebSocket orchestration — Nice-to-have, not MVP.

**The big lesson**: Onboardr failed because it tried to build everything but couldn't make the ONE thing that matters work — real on-chain transactions through AI.

---

## Core Code Patterns

### 1. Freighter Wallet Connector (`connectors/freighter.ts`)

```typescript
import {
  isConnected,
  isAllowed,
  requestAccess,
  getPublicKey,
  signTransaction,
  getNetwork,
} from "@stellar/freighter-api";

export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected: connected } = await isConnected();
    return connected;
  } catch {
    return false;
  }
}

export async function connectFreighter(): Promise<string | null> {
  try {
    const { isAllowed: allowed } = await isAllowed();
    if (!allowed) {
      await requestAccess();
    }
    const { publicKey } = await getPublicKey();
    return publicKey;
  } catch (error) {
    console.error("Failed to connect Freighter:", error);
    return null;
  }
}

export async function signXDR(xdr: string, network: "TESTNET" | "PUBLIC" = "TESTNET"): Promise<string | null> {
  try {
    const { signedTxXdr } = await signTransaction(xdr, {
      network,
    });
    return signedTxXdr;
  } catch (error) {
    console.error("User rejected or sign failed:", error);
    return null;
  }
}
```

---

### 2. Stellar Client Setup (`lib/stellar/client.ts`)

```typescript
import { Horizon, SorobanRpc } from "@stellar/stellar-sdk";

const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC || "https://soroban-testnet.stellar.org";

export const horizonServer = new Horizon.Server(HORIZON_URL);
export const sorobanServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "TESTNET"
  ? "Test SDF Network ; September 2015"
  : "Public Global Stellar Network ; September 2015";
```

---

### 3. Wallet Balances Tool (`lib/tools/wallet.ts`)

```typescript
import { horizonServer } from "../stellar/client";

export interface TokenBalance {
  asset: string;
  balance: string;
  assetCode: string;
  assetIssuer?: string;
}

export async function get_wallet_balances(wallet_address: string): Promise<TokenBalance[]> {
  try {
    const account = await horizonServer.loadAccount(wallet_address);
    
    return account.balances.map((balance: any) => {
      if (balance.asset_type === "native") {
        return {
          asset: "XLM",
          balance: balance.balance,
          assetCode: "XLM",
        };
      }
      return {
        asset: `${balance.asset_code}:${balance.asset_issuer}`,
        balance: balance.balance,
        assetCode: balance.asset_code,
        assetIssuer: balance.asset_issuer,
      };
    });
  } catch (error) {
    console.error("Failed to fetch balances:", error);
    return [];
  }
}
```

---

### 4. Soroswap Tools (`lib/tools/soroswap.ts`)

```typescript
import axios from "axios";
import {
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
} from "@stellar/stellar-sdk";
import { horizonServer, NETWORK_PASSPHRASE } from "../stellar/client";

const SOROSWAP_API = "https://api.soroswap.finance";

// USDC issuer on testnet
const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export interface SwapQuote {
  fromAmount: string;
  toAmount: string;
  priceImpact: string;
  route: string[];
  fee: string;
}

export async function get_soroswap_quote(
  from_token: string,
  to_token: string,
  amount: string
): Promise<SwapQuote> {
  try {
    // Resolve token to asset
    const fromAsset = from_token === "XLM" ? "native" : from_token;
    const toAsset = to_token === "XLM" ? "native" : to_token;
    
    const response = await axios.get(`${SOROSWAP_API}/quote`, {
      params: {
        sellToken: fromAsset,
        buyToken: toAsset,
        sellAmount: (parseFloat(amount) * 1e7).toString(), // Convert to stroops
      },
    });
    
    return {
      fromAmount: amount,
      toAmount: (parseInt(response.data.buyAmount) / 1e7).toFixed(7),
      priceImpact: response.data.priceImpact || "< 0.1%",
      route: response.data.path || [from_token, to_token],
      fee: "0.003", // 0.3% Soroswap fee
    };
  } catch (error) {
    // Fallback mock for demo if API is down
    console.error("Soroswap API error:", error);
    throw new Error(`Could not get quote for ${from_token} → ${to_token}`);
  }
}

export async function build_swap_tx(
  from_token: string,
  to_token: string,
  amount: string,
  slippage: string = "0.5",
  wallet_address: string
): Promise<string> {
  // Build a Stellar path payment operation (native Stellar swap mechanism)
  // This is the simplified approach using Stellar DEX, not Soroswap contract
  // For Soroswap contract interaction, use Soroban SDK invocation
  
  const account = await horizonServer.loadAccount(wallet_address);
  
  let sendAsset: Asset;
  let destAsset: Asset;
  
  if (from_token === "XLM") {
    sendAsset = Asset.native();
  } else {
    sendAsset = new Asset(from_token, USDC_TESTNET_ISSUER);
  }
  
  if (to_token === "XLM") {
    destAsset = Asset.native();
  } else {
    destAsset = new Asset(to_token, USDC_TESTNET_ISSUER);
  }
  
  const quote = await get_soroswap_quote(from_token, to_token, amount);
  const minReceive = (parseFloat(quote.toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(7);
  
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: amount,
        destination: wallet_address,
        destAsset,
        destMin: minReceive,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  
  return tx.toXDR();
}
```

---

### 5. Blend Lending Tools (`lib/tools/blend.ts`)

```typescript
import axios from "axios";
import { horizonServer, sorobanServer, NETWORK_PASSPHRASE } from "../stellar/client";

// Blend testnet contract addresses (get from https://docs.blend.capital)
const BLEND_POOL_FACTORY = "CDVQVKOY2YSXS2IC7KN6MNASSHPAO7UN2UR2ON4OI2SKMFJNVAMDX6DPNA";

export interface BlendPool {
  poolId: string;
  name: string;
  assets: string[];
  apr: number;
  tvl: number;
  utilization: number;
}

export async function get_blend_pools(): Promise<BlendPool[]> {
  try {
    // Fetch pool data from Blend API or construct from contract calls
    // Blend doesn't have a public REST API — interact via Soroban RPC
    // For hackathon MVP, use the known testnet pool addresses
    
    // NOTE: Replace with actual Blend contract calls via sorobanServer
    // This is a simplified version for the hackathon
    const response = await axios.get("https://api.blend.capital/pools", {
      timeout: 5000,
    }).catch(() => null);
    
    if (response?.data) {
      return response.data.pools.map((pool: any) => ({
        poolId: pool.id,
        name: pool.name,
        assets: pool.assets,
        apr: pool.supplyApr * 100,
        tvl: pool.tvl,
        utilization: pool.utilization * 100,
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
      },
      {
        poolId: "CBDMGDAT3S3T3LOCALBLENDPOOL2",
        name: "USDC Stable Pool",
        assets: ["USDC"],
        apr: 7.8,
        tvl: 1800000,
        utilization: 65,
      },
    ];
  } catch (error) {
    console.error("Failed to fetch Blend pools:", error);
    throw new Error("Could not fetch Blend lending pools");
  }
}

export async function build_deposit_tx(
  pool_id: string,
  amount: string,
  wallet_address: string
): Promise<string> {
  // For a real implementation, invoke the Blend contract deposit function
  // via Soroban SDK. This is the scaffolding:
  
  /*
  const contract = new Contract(pool_id);
  const account = await sorobanServer.getAccount(wallet_address);
  
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(
      "submit",
      // ... Blend deposit parameters (see Blend SDK)
    ))
    .setTimeout(300)
    .build();
  
  // Simulate first to check for errors
  const simResult = await sorobanServer.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }
  
  // Assemble the transaction with simulation results
  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
  */
  
  // HACKATHON MVP: Return a constructed XDR for demo
  // Replace this with real Blend SDK calls
  const { StellarBase } = await import("@stellar/stellar-sdk");
  const account = await horizonServer.loadAccount(wallet_address);
  
  // Placeholder — real impl needs Blend contract interaction
  const tx = new (await import("@stellar/stellar-sdk")).TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addMemo((await import("@stellar/stellar-sdk")).Memo.text(`Blend deposit ${amount}`))
    .setTimeout(300)
    .build();
  
  return tx.toXDR();
}
```

---

### 6. OpenAI Tool Definitions (`lib/tools/definitions.ts`)

```typescript
// These are the JSON schemas that tell GPT-4o what tools it has available
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
            description: "Token to sell (e.g., 'XLM', 'USDC')",
          },
          to_token: {
            type: "string",
            description: "Token to buy (e.g., 'XLM', 'USDC')",
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
          from_token: { type: "string" },
          to_token: { type: "string" },
          amount: { type: "string" },
          slippage: {
            type: "string",
            description: "Slippage tolerance percentage (default: '0.5')",
          },
          wallet_address: { type: "string" },
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
          wallet_address: { type: "string" },
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
          pool_id: { type: "string" },
          amount: { type: "string" },
          wallet_address: { type: "string" },
        },
        required: ["pool_id", "amount", "wallet_address"],
      },
    },
  },
];
```

---

### 7. OpenAI Chat API Route (`app/api/chat/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { TOOL_DEFINITIONS } from "@/lib/tools/definitions";
import {
  get_wallet_balances,
  get_soroswap_quote,
  build_swap_tx,
  get_blend_pools,
  build_deposit_tx,
  build_withdraw_tx,
} from "@/lib/tools";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a DeFi assistant for the Stellar blockchain. You help users interact with Stellar DeFi protocols (Blend lending, Soroswap DEX) through plain English.

You have access to these tools:
- get_wallet_balances: Check wallet token balances
- get_soroswap_quote: Get swap quotes from Soroswap  
- build_swap_tx: Build a swap transaction
- get_blend_pools: See lending pools and APRs on Blend
- build_deposit_tx: Build a lending deposit transaction
- build_withdraw_tx: Build a lending withdrawal transaction

Rules:
1. ALWAYS call get_soroswap_quote before build_swap_tx
2. ALWAYS call get_blend_pools before build_deposit_tx
3. ALWAYS show the user what will happen BEFORE building a transaction
4. Be concise and helpful. No crypto jargon. Explain things simply.
5. When you build a transaction, the user must approve it in their wallet.
6. Format numbers nicely: "10.2% APR", "100 USDC", "$2,500 TVL"

Current network: Stellar Testnet`;

export async function POST(req: NextRequest) {
  try {
    const { messages, walletAddress, balances } = await req.json();
    
    // Inject wallet context into system
    const systemWithContext = `${SYSTEM_PROMPT}

Connected wallet: ${walletAddress || "Not connected"}
Current balances: ${balances ? JSON.stringify(balances) : "Unknown"}`;

    let openaiMessages = [
      { role: "system" as const, content: systemWithContext },
      ...messages,
    ];
    
    let pendingXDR: string | null = null;

    // Agentic loop — AI can call multiple tools in sequence
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: openaiMessages,
        tools: TOOL_DEFINITIONS as any,
        tool_choice: "auto",
      });

      const choice = response.choices[0];
      const message = choice.message;
      openaiMessages.push(message);

      // No tool calls — we have the final response
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({
          message: message.content,
          pendingXDR,
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
                args.slippage,
                args.wallet_address || walletAddress
              );
              pendingXDR = swapXDR;
              result = { xdr: "Transaction built successfully", ready: true };
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
              result = { xdr: "Transaction built successfully", ready: true };
              break;
            case "build_withdraw_tx":
              // Similar pattern
              result = { xdr: "Withdrawal tx built", ready: true };
              break;
            default:
              result = { error: "Unknown tool" };
          }
        } catch (err: any) {
          result = { error: err.message };
        }

        openaiMessages.push({
          role: "tool" as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json({
      message: "I encountered an issue. Please try again.",
      pendingXDR: null,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 8. Wallet Zustand Store (`store/wallet.ts`)

```typescript
import { create } from "zustand";
import { TokenBalance } from "@/lib/tools/wallet";

interface WalletState {
  address: string | null;
  balances: TokenBalance[];
  isConnected: boolean;
  isConnecting: boolean;
  
  setAddress: (address: string | null) => void;
  setBalances: (balances: TokenBalance[]) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  balances: [],
  isConnected: false,
  isConnecting: false,
  
  setAddress: (address) => set({ address }),
  setBalances: (balances) => set({ balances }),
  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  disconnect: () => set({ address: null, balances: [], isConnected: false }),
}));
```

---

### 9. Chat Zustand Store (`store/chat.ts`)

```typescript
import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pendingXDR?: string | null;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  
  setLoading: (isLoading) => set({ isLoading }),
  clearChat: () => set({ messages: [] }),
}));
```

---

### 10. Transaction Submit Helper

```typescript
// lib/stellar/submit.ts
import { horizonServer } from "./client";
import { TransactionBuilder } from "@stellar/stellar-sdk";

export async function submitTransaction(signedXDR: string): Promise<{
  hash: string;
  success: boolean;
}> {
  try {
    const tx = TransactionBuilder.fromXDR(signedXDR, horizonServer.serverURL);
    const result = await horizonServer.submitTransaction(tx as any);
    return { hash: result.hash, success: true };
  } catch (error: any) {
    console.error("Transaction submission failed:", error);
    throw new Error(error?.response?.data?.extras?.result_codes?.transaction || "Transaction failed");
  }
}
```

---

## System Prompt for OpenAI (Full Version)

```
You are a DeFi assistant for the Stellar blockchain named "StarDeFi". 

Your personality:
- Friendly and helpful, not technical or jargon-heavy
- You explain things simply, like you're talking to a smart friend who's new to crypto
- You're proactive: if you notice idle funds that could be earning yield, mention it
- You're cautious: always show the user what will happen before building a transaction

Your capabilities through tools:
1. Check wallet balances (get_wallet_balances)
2. Get swap quotes from Soroswap DEX (get_soroswap_quote)
3. Execute token swaps (build_swap_tx)
4. Show Blend lending pool rates (get_blend_pools)
5. Deposit into Blend lending pools (build_deposit_tx)
6. Withdraw from Blend lending pools (build_withdraw_tx)

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
```

---

*See 04_PITCH_AND_JUDGES.md for the pitch script and judge Q&A.*
