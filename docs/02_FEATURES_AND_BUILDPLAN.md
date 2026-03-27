# Features to Build & Day-by-Day Plan
> Feed this THIRD. Tells you exactly what to build, in what order, and what to skip.

---

## The Golden Rule

> **3 features that work PERFECTLY > 10 half-broken features.**
> 
> The #1 mistake in hackathons is not a bad product — it's a bad presentation. Bugs won't lose you a hackathon, but broken core features will.

---

## Feature Priority List

### MUST HAVE — MVP (Build These First, Don't Skip)

#### Feature 1: Wallet Connect + Balance Display
**What it does**: Connect Freighter wallet, show all token balances, show portfolio value in USD

**Why judges care**: Proves you can read real on-chain data. Foundation for everything else. Without this, nothing else works.

**Acceptance criteria**:
- [ ] "Connect Wallet" button visible on load
- [ ] Clicking it triggers Freighter popup
- [ ] After connect, shows wallet address (truncated: `GXYZ...ABCD`)
- [ ] Shows all token balances (XLM, USDC, etc.) with USD values
- [ ] "Disconnect" option available
- [ ] Balances refresh after each transaction

**Key code**: Uses `@stellar/freighter-api` + Horizon API account endpoint

---

#### Feature 2: AI Chat with Swap Execution
**What it does**: User says "swap 50 XLM to USDC" → AI gets quote from Soroswap → builds TX → user signs → executed on-chain

**Why judges care**: This is the CORE DEMO MOMENT. A real blockchain transaction happening through a conversation.

**Acceptance criteria**:
- [ ] Chat input box accepts natural language
- [ ] AI understands "swap", "exchange", "convert" intents
- [ ] AI calls `get_soroswap_quote()` and shows real-time pricing
- [ ] AI shows transaction preview BEFORE asking user to sign
- [ ] Preview shows: from amount, to amount, price impact, estimated fee
- [ ] "Approve" button triggers Freighter signing popup
- [ ] After signing, tx submitted to Stellar
- [ ] AI confirms with "Swap complete! Received X USDC"
- [ ] Balance display updates after tx

**Key user commands to handle**:
- "swap 50 XLM to USDC"
- "exchange my XLM for USDC"
- "convert 100 XLM"
- "what's the rate for XLM to USDC?"

---

#### Feature 3: AI Chat with Blend Lending
**What it does**: User says "lend 100 USDC" → AI finds best Blend pool → builds deposit TX → user signs → deposited on-chain

**Why judges care**: Shows multi-protocol support. Two real DeFi actions (swap + lend) through one interface = strong demo.

**Acceptance criteria**:
- [ ] AI understands "lend", "deposit", "earn yield", "put to work" intents
- [ ] AI calls `get_blend_pools()` and compares APRs
- [ ] AI recommends the BEST pool with reasoning ("The USDC-XLM pool offers 10.2% APR, highest available")
- [ ] Shows transaction preview: amount, pool name, expected APR, estimated monthly earnings
- [ ] "Approve" triggers Freighter signing
- [ ] After tx, AI confirms with position details
- [ ] User can ask "how much am I earning?" afterwards

**Key user commands to handle**:
- "lend 100 USDC"
- "deposit my USDC"
- "earn yield on my USDC"
- "what are the lending rates?"
- "show me Blend pools"
- "put my USDC to work"

---

### SHOULD HAVE (Build If Time Permits — Days 5-6)

#### Feature 4: Pool Rate Comparison
**What it does**: "Show me the best lending rates" → AI shows formatted table of all Blend pools sorted by APR

**Implementation**: Simple — just call `get_blend_pools()`, sort by APR, format nicely in chat

**User commands**: "best rates", "show me all pools", "compare lending options"

---

#### Feature 5: Natural Language Balance Queries
**What it does**: "What's my portfolio worth?", "How much USDC do I have?", "What's the XLM price?"

**Implementation**: `get_wallet_balances()` tool + price feed (Soroswap API has prices)

---

#### Feature 6: Transaction History
**What it does**: Show past txs executed through the AI with timestamps and amounts

**Implementation**: Store tx hashes in Zustand, fetch details from Horizon API

---

### NICE TO HAVE (Wow Factor — Only If MVP is Solid)

#### Feature 7: x402 Integration ⭐ JUDGE MAGNET
**Why it's impressive**: x402 protocol launched on Stellar March 10, 2026 (2 weeks ago). Judges will know this and will be VERY impressed.

**What to show**: AI autonomously pays for a premium data feed using USDC micropayments. Even a simulated demo of this flow is impressive.

**What to say to judges**: "x402 just launched on Stellar 2 weeks ago. Our AI can autonomously pay for premium data using USDC micropayments — no API keys, no subscriptions, just crypto-native payments."

---

#### Feature 8: Auto-Strategy Suggestions
**What it does**: AI proactively says: "Your USDC is sitting idle. Want me to lend it at 10.2% APR?"

**Trigger**: After wallet connect, check if any idle stablecoins could be earning yield

---

#### Feature 9: Multi-Action in One Command
**Example**: "Swap half my XLM to USDC and lend the rest"

**Implementation**: AI chains multiple tool calls in sequence

---

## Day-by-Day Build Plan

### Day 1: Project Setup + Wallet Connect (6-8 hours)
**Morning**:
- [ ] `npx create-next-app@latest` with TypeScript + Tailwind
- [ ] Install all packages (see tech stack file)
- [ ] Set up shadcn/ui
- [ ] Configure `.env.local`

**Afternoon**:
- [ ] Copy Freighter connector from Onboardr (see code reference file)
- [ ] Build `WalletConnect.tsx` component
- [ ] Build `wallet.ts` Zustand store
- [ ] Connect Horizon API to read balances
- [ ] Display balances in UI

**End of Day 1 checkpoint**: App loads, connects Freighter, shows real wallet balances ✓

---

### Day 2: Chat UI + OpenAI Integration (6-8 hours)
**Morning**:
- [ ] Build `ChatMessage.tsx` component (user + AI bubble styles)
- [ ] Build `chat.ts` Zustand store
- [ ] Build the main chat interface in `app/page.tsx`

**Afternoon**:
- [ ] Create `app/api/chat/route.ts`
- [ ] Integrate OpenAI API with basic system prompt
- [ ] Pass wallet address + balances as context to AI
- [ ] Test: basic conversation works, AI knows your wallet balance

**End of Day 2 checkpoint**: Can type messages, AI responds with wallet context ✓

---

### Day 3: Soroswap Swap Tool (8-10 hours)
**Focus**: Get the FIRST REAL TRANSACTION working through chat

**Tasks**:
- [ ] Build `lib/tools/soroswap.ts`:
  - `get_soroswap_quote(from, to, amount)` — hits api.soroswap.finance
  - `build_swap_tx(from, to, amount, slippage, walletAddress)` — builds XDR
- [ ] Add tool definitions to `lib/tools/definitions.ts`
- [ ] Wire tools into `/api/chat/route.ts` function calling
- [ ] Build `TransactionPreview.tsx` component
- [ ] Handle signing flow: preview → Freighter sign → submit → confirm

**End of Day 3 checkpoint**: "swap 50 XLM to USDC" → real on-chain swap ✓

---

### Day 4: Blend Lending Tool (8-10 hours)
**Focus**: Second real DeFi action through chat

**Tasks**:
- [ ] Build `lib/tools/blend.ts`:
  - `get_blend_pools()` — fetch pool data from Blend via Soroban RPC
  - `build_deposit_tx(poolId, amount, walletAddress)` — constructs deposit XDR
  - `build_withdraw_tx(poolId, amount, walletAddress)` — constructs withdraw XDR
- [ ] Add to tool definitions
- [ ] Test: "lend 100 USDC" → real Blend deposit on testnet

**End of Day 4 checkpoint**: "lend my USDC" → real Blend deposit ✓

---

### Day 5: Polish + Extra Features (6-8 hours)
- [ ] Transaction history display
- [ ] Error handling (insufficient balance, network errors, user rejected signing)
- [ ] Loading states (streaming AI response)
- [ ] "Show me all lending rates" → pool comparison table
- [ ] Natural language balance queries
- [ ] Edge case handling: wrong network, wallet not installed

---

### Day 6: UI Polish + End-to-End Testing (6-8 hours)
- [ ] Full design polish — make it LOOK like a shipped product
- [ ] Test all 3 core flows end-to-end multiple times
- [ ] Fix any edge cases found
- [ ] Write README.md (judges read this)
- [ ] Record a backup demo video (in case live demo fails)
- [ ] Deploy to Vercel

---

### Day 7: Demo Prep + Submission (4-6 hours)
- [ ] Rehearse 3-minute pitch script 5+ times
- [ ] Prepare testnet wallet with funds (XLM, USDC) for live demo
- [ ] Set up demo environment (no notifications, clean browser)
- [ ] Create DoraHacks submission with demo video + GitHub link
- [ ] Submit

---

## README Structure (Judges Read This)

```markdown
# Stellar DeFi Assistant

> Interact with Stellar DeFi through plain English. No crypto expertise required.

## Demo
[Link to live demo] | [Demo video]

## What It Does
- Connect your Freighter wallet
- Type "lend my USDC at the best rate"
- AI finds the best Blend pool, constructs the transaction
- You approve with one click
- Done

## How It Works
[Architecture diagram or description]
[LLM function calling explanation]

## Tech Stack
Next.js 14 + OpenAI GPT-4o + Stellar SDK + Freighter + Soroswap + Blend

## Local Development
[Setup instructions]

## What's Next
[x402 integration, SCF grant application, etc.]
```

---

*See 03_CODE_REFERENCE.md for actual code patterns to implement each feature.*
