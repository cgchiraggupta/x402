# Tech Stack & System Architecture
> Feed this SECOND. Contains all technical decisions and architecture.

---

## Complete Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14 (App Router) + TypeScript** | App Router = API routes built-in. MERN skills transfer directly. |
| UI Components | **shadcn/ui + Tailwind CSS** | Pre-built accessible components. Looks professional out of the box. |
| State Management | **Zustand** | Simpler than Redux. 5 lines to create a store. |
| AI / LLM | **OpenAI API (GPT-4o) with Function Calling** | Best function calling support. Alternative: Claude API. |
| Blockchain SDK | **@stellar/stellar-sdk** (npm) | Official Stellar SDK for JavaScript. Builds transactions, queries Horizon. |
| Wallet | **@stellar/freighter-api** | Most popular Stellar browser wallet. One-click connect. |
| Soroswap Data | **api.soroswap.finance** (REST) | Real-time pool data, swap quotes, routing. |
| Blend Data | **Soroban RPC + Blend contract ABIs** | Direct contract calls for lending pool data. |
| Hosting | **Vercel** (free tier) | Deploy Next.js in 30 seconds. Free for hackathons. |
| Network | **Stellar Testnet** (dev) → **Mainnet** (demo) | Testnet for building, mainnet for impressive live demo. |

## What You DON'T Need
- ❌ No database — Wallet connection = identity. In-memory state for demo.
- ❌ No backend server — Next.js API routes handle everything.
- ❌ No Rust/Soroban — Calling EXISTING contracts (Blend, Soroswap), not writing new ones.
- ❌ No Docker — Vercel handles deployment.
- ❌ No auth system — Wallet connect IS authentication.
- ❌ No NextAuth/Supabase — Unnecessary complexity.

---

## System Architecture (Full)

```
User's Browser
│
├── Freighter Wallet Extension (signs transactions)
│
└── Next.js 14 Frontend
    ├── Chat UI (shadcn/ui components)
    │   └── User types natural language command
    │
    └── /api/chat (API Route)
        ├── Receives: message + wallet address + token balances
        ├── Calls OpenAI API with function calling tools:
        │   ├── get_blend_pools()       → fetches Blend lending data
        │   ├── get_soroswap_quote()    → gets swap pricing
        │   ├── get_wallet_balances()   → reads on-chain balances
        │   ├── build_deposit_tx()      → constructs Blend deposit XDR
        │   ├── build_swap_tx()         → constructs Soroswap swap XDR
        │   └── build_withdraw_tx()     → constructs Blend withdraw XDR
        │
        └── Returns: AI text response + transaction XDR (if action needed)

Transaction Signing Flow:
  1. Frontend receives XDR from /api/chat
  2. Shows transaction preview to user (amount, pool, expected return)
  3. User clicks "Approve" → Freighter signs
  4. Signed TX submitted to Stellar network
  5. AI confirms: "Done! 100 USDC deposited. Earning 10.2% APR."

External Services:
├── Stellar Horizon API        → account data, balances, tx history
├── Stellar Soroban RPC        → smart contract calls (Blend, Soroswap contracts)
├── api.soroswap.finance       → pool data, swap routing
└── OpenAI API                 → natural language understanding + tool selection
```

---

## The Core Innovation: LLM Function Calling (Tools)

This is what makes the project different from every other chatbot. You define "tools" for the AI — each tool is a JavaScript function that does something real on Stellar.

### Tool Definitions

| Tool | What It Does | Input | Output |
|------|-------------|-------|--------|
| `get_blend_pools()` | Fetches all Blend lending pools with real-time APRs | None | Array of pools with APR, TVL, token pairs |
| `get_soroswap_quote()` | Gets real-time swap quote | from_token, to_token, amount | Expected output amount, price impact, route |
| `get_wallet_balances()` | Reads all token balances for connected wallet | wallet_address | Array of token balances |
| `build_deposit_tx()` | Constructs Blend deposit transaction XDR | pool_id, amount, wallet_address | Unsigned XDR string for Freighter to sign |
| `build_swap_tx()` | Constructs Soroswap swap transaction XDR | from, to, amount, slippage | Unsigned XDR string for Freighter to sign |
| `build_withdraw_tx()` | Constructs Blend withdrawal XDR | pool_id, amount, wallet_address | Unsigned XDR string for Freighter to sign |

### How Function Calling Works (Conceptually)

```
User: "Swap 50 XLM to USDC"
         ↓
AI receives message + context (wallet address, current balances)
         ↓
AI decides: I need to call get_soroswap_quote(XLM, USDC, 50)
         ↓
Your JS function actually runs → hits api.soroswap.finance → gets real quote
         ↓
AI receives quote result → decides: I need to call build_swap_tx(XLM, USDC, 50, 0.5%)
         ↓
Your JS function builds real XDR transaction
         ↓
AI responds: "I found a swap: 50 XLM → 8.23 USDC (0.2% price impact). Approve?"
         ↓
User clicks Approve → Freighter signs → Transaction submitted → Confirmed in 5s
```

---

## Key Stellar Concepts You Need

### XDR (External Data Representation)
- The serialized format for Stellar transactions
- Like a "transaction blob" — wallet signs this, network executes it
- Your `build_*_tx()` functions output XDR strings
- Freighter wallet accepts XDR to sign

### Horizon API
- REST API to read Stellar blockchain data
- Endpoint: `https://horizon-testnet.stellar.org` (testnet) / `https://horizon.stellar.org` (mainnet)
- Use for: account balances, transaction history, account exists check

### Soroban RPC
- Endpoint for interacting with Soroban smart contracts (like Blend)
- Use for: calling contract functions, simulating transactions before submitting
- Key method: `simulateTransaction()` — verify tx will succeed before asking user to sign

### Freighter Wallet Flow
```javascript
// 1. Check if installed
const isAvailable = await isFreighterConnected();

// 2. Connect (prompts user)
await requestAccess();

// 3. Get address
const publicKey = await getPublicKey();

// 4. Sign XDR
const { signedXDR } = await signTransaction(xdr, { network: 'TESTNET' });

// 5. Submit
await server.submitTransaction(signedXDR);
```

---

## Project Folder Structure

```
stellar-defi-assistant/
├── app/
│   ├── page.tsx                    # Main chat page with wallet connect
│   ├── layout.tsx                  # Root layout
│   └── api/
│       └── chat/
│           └── route.ts            # OpenAI API endpoint with function calling
│
├── components/
│   ├── ChatMessage.tsx             # Chat bubble for user + AI messages
│   ├── TransactionPreview.tsx      # Shows TX details before user signs
│   └── WalletConnect.tsx          # Connect wallet button + balance display
│
├── lib/
│   ├── stellar/
│   │   └── client.ts               # Stellar SDK setup — Horizon server, Soroban RPC
│   └── tools/
│       ├── soroswap.ts             # get_soroswap_quote() + build_swap_tx()
│       ├── blend.ts                # get_blend_pools() + build_deposit_tx() + build_withdraw_tx()
│       ├── wallet.ts               # get_wallet_balances() via Horizon API
│       └── definitions.ts          # OpenAI tool definitions (JSON schema for each function)
│
├── connectors/
│   └── freighter.ts                # Freighter wallet connector
│
├── store/
│   ├── wallet.ts                   # Zustand: wallet state (address, balances, connected)
│   └── chat.ts                     # Zustand: chat messages
│
└── package.json
```

---

## npm Packages to Install

```bash
npx create-next-app@latest stellar-defi-assistant --typescript --tailwind --app
cd stellar-defi-assistant

# Stellar
npm install @stellar/stellar-sdk @stellar/freighter-api

# AI
npm install openai

# UI
npx shadcn@latest init
npx shadcn@latest add button input card scroll-area badge

# State
npm install zustand

# Utilities
npm install axios
```

---

## Environment Variables (.env.local)

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
```

---

## Key External APIs

### Soroswap API (Free, No Auth)
- Base: `https://api.soroswap.finance`
- Get pools: `GET /pools`
- Get quote: `GET /quote?from={token}&to={token}&amount={amount}`
- Documentation: https://docs.soroswap.finance

### Blend Protocol (Soroban Contract)
- Testnet contract IDs available in Blend docs
- Interact via Soroban RPC simulation
- Key operations: deposit, withdraw, borrow, repay

### Stellar Horizon (Free, No Auth)
- Testnet: `https://horizon-testnet.stellar.org`
- Get account: `GET /accounts/{address}`
- Get balances: From account object `.balances[]`

---

*See 02_FEATURES_AND_BUILDPLAN.md for what to build and in what order.*
*See 03_CODE_REFERENCE.md for reusable code patterns and snippets.*
