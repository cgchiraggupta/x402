# Kimi/Zed LLM Prompts — Exact Prompts to Generate Each File
> Feed this LAST. Use these prompts with Kimi after feeding it all other context files.
> Feed files 00–04 first, then use these prompts one at a time.

---

## HOW TO USE THIS FILE

1. Open Kimi (or Zed AI) with a long context window
2. Paste ALL of files 00–04 into the context (or upload them)
3. Use the prompts below in ORDER — each prompt builds on the previous output
4. Save each generated file before moving to the next prompt
5. Do NOT skip the order — later files depend on earlier ones

---

## PROMPT 0 — Initial Context Load (Run This First)

```
I am building an AI-powered DeFi assistant for the Stellar blockchain for a hackathon. 
I have given you the complete project context in the files above.

Please confirm you understand the project by summarizing:
1. What the app does (1 sentence)
2. The 3 core features I need to build
3. The tech stack
4. What makes this different from a chatbot

Do NOT start coding yet. Just confirm your understanding.
```

---

## PROMPT 1 — Project Setup & Config

```
Based on the project context provided, generate the following setup files:

1. package.json with all required dependencies:
   - @stellar/stellar-sdk
   - @stellar/freighter-api
   - openai (npm)
   - zustand
   - axios
   - next 14, react, typescript, tailwind

2. .env.local (with placeholder values and comments for each variable)

3. next.config.js (with any needed configuration for the Stellar SDK)

4. tsconfig.json (standard Next.js 14 TypeScript config)

5. A setup instructions comment block showing the exact commands to run from scratch

Output each file clearly labeled. Use TypeScript throughout.
```

---

## PROMPT 2 — Stellar Client & Freighter Connector

```
Generate the following two files for the Stellar DeFi Assistant project:

FILE 1: lib/stellar/client.ts
- Export horizonServer (Horizon.Server instance)
- Export sorobanServer (SorobanRpc.Server instance)  
- Export NETWORK_PASSPHRASE based on env variable
- Support both testnet and mainnet via env variable
- Add TypeScript types

FILE 2: connectors/freighter.ts
- checkFreighterInstalled(): Promise<boolean>
- connectFreighter(): Promise<string | null> — returns public key
- getConnectedAddress(): Promise<string | null>
- signXDR(xdr: string, network: 'TESTNET' | 'PUBLIC'): Promise<string | null>
- disconnectFreighter(): void
- All functions should have proper error handling with console.error logging
- Export all functions

Use @stellar/freighter-api package.
Include JSDoc comments on each function.
```

---

## PROMPT 3 — Zustand Stores

```
Generate the following Zustand state management stores:

FILE 1: store/wallet.ts
State:
- address: string | null
- balances: TokenBalance[] (define this interface too)
- isConnected: boolean
- isConnecting: boolean
- network: 'TESTNET' | 'PUBLIC'

Actions:
- setAddress, setBalances, setConnected, setConnecting, setNetwork
- disconnect() — resets all state to default

FILE 2: store/chat.ts  
State:
- messages: ChatMessage[] (define this interface: id, role, content, pendingXDR?, timestamp)
- isLoading: boolean

Actions:
- addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>)
- updateLastMessage(content: string) — for streaming support
- setLoading(loading: boolean)
- clearChat()

Use zustand's create function with TypeScript generics.
Export the store hooks (useWalletStore, useChatStore).
```

---

## PROMPT 4 — Tool Functions (Core Logic)

```
Generate the following tool implementation files. These are the functions the AI will call.

FILE 1: lib/tools/wallet.ts
- TokenBalance interface: { asset, balance, assetCode, assetIssuer? }
- get_wallet_balances(wallet_address: string): Promise<TokenBalance[]>
  - Use horizonServer.loadAccount()
  - Handle both native XLM and custom assets
  - Return empty array on error (don't throw)

FILE 2: lib/tools/soroswap.ts
- SwapQuote interface: { fromAmount, toAmount, priceImpact, route, fee }
- get_soroswap_quote(from_token, to_token, amount): Promise<SwapQuote>
  - Hit https://api.soroswap.finance/quote
  - Convert amounts from/to stroops (1 XLM = 10,000,000 stroops)
  - Include fallback if API is unreachable
- build_swap_tx(from_token, to_token, amount, slippage, wallet_address): Promise<string>
  - Use TransactionBuilder + Operation.pathPaymentStrictSend
  - Load account from horizonServer
  - Return XDR string
  - Handle XLM as native asset, others as custom assets with testnet issuers

FILE 3: lib/tools/blend.ts
- BlendPool interface: { poolId, name, assets, apr, tvl, utilization }
- get_blend_pools(): Promise<BlendPool[]>
  - Try to fetch from Blend API first
  - Fall back to hardcoded testnet pools for demo (include 2-3 realistic pools)
- build_deposit_tx(pool_id, amount, wallet_address): Promise<string>
  - Build Soroban contract invocation using stellar-sdk
  - Include simulateTransaction() call
  - Return XDR string
- build_withdraw_tx(pool_id, amount, wallet_address): Promise<string>
  - Same pattern as deposit

FILE 4: lib/tools/index.ts
- Re-export all tools for easy import

Use TypeScript throughout. Include error handling.
```

---

## PROMPT 5 — OpenAI Tool Definitions

```
Generate: lib/tools/definitions.ts

This file should export TOOL_DEFINITIONS — an array of OpenAI function calling tool definitions.

Include tools for:
1. get_wallet_balances — takes wallet_address, returns balances
2. get_soroswap_quote — takes from_token, to_token, amount
3. build_swap_tx — takes from_token, to_token, amount, slippage (optional, default "0.5"), wallet_address
4. get_blend_pools — takes no parameters
5. build_deposit_tx — takes pool_id, amount, wallet_address
6. build_withdraw_tx — takes pool_id, amount, wallet_address

Each tool definition needs:
- type: "function"
- function.name (matching exactly the function names in our tools)
- function.description (clear, helpful, tells the AI WHEN to call this tool)
- function.parameters (JSON schema with types, descriptions, required fields)

The descriptions are CRITICAL — the AI uses them to decide which tool to call.
Write descriptions that make the AI's decision-making obvious.

Use the OpenAI ChatCompletionTool type from the openai package.
```

---

## PROMPT 6 — Chat API Route (Core Backend)

```
Generate: app/api/chat/route.ts

This is the Next.js API route that powers the entire AI chat. Requirements:

Request body:
- messages: Array of {role: 'user'|'assistant', content: string}
- walletAddress: string
- balances: TokenBalance[]

Response:
- message: string (AI's text response)
- pendingXDR: string | null (transaction to sign, if any)

Implementation:
1. Import all tool functions and TOOL_DEFINITIONS
2. Build system prompt that includes:
   - AI personality (helpful DeFi assistant named StarDeFi)
   - Available tools description
   - Connected wallet address and balances injected
   - Transaction flow rules (always show quote before building tx)
   - Response formatting rules (concise, no jargon)
   - Current network (testnet)
3. Agentic loop (max 5 iterations):
   - Call OpenAI gpt-4o with function calling enabled
   - If no tool calls → return final response
   - If tool calls → execute each tool, add results to messages, loop
   - Track pendingXDR if any build_*_tx function is called
4. Error handling for OpenAI API failures
5. Export as POST handler

Use openai npm package (not fetch).
TypeScript throughout.
```

---

## PROMPT 7 — React Components

```
Generate the following React components using shadcn/ui and Tailwind CSS:

FILE 1: components/WalletConnect.tsx
- "Connect Wallet" button when disconnected
- Shows truncated address (first 4 + last 4 chars) + disconnect button when connected
- Shows list of token balances with amounts
- Shows total portfolio value in USD (calculate from balances)
- Loading state while connecting
- Uses useWalletStore hook
- Calls connectFreighter() from connectors/freighter.ts

FILE 2: components/ChatMessage.tsx
Props: { message: ChatMessage }
- Different styles for user messages (right-aligned) vs AI messages (left-aligned)
- AI messages have a small Stellar logo or "✦" icon
- Shows timestamp
- If message has pendingXDR, show a TransactionPreview component inline

FILE 3: components/TransactionPreview.tsx
Props: { xdr: string, onApprove: () => void, onReject: () => void }
- Shows "Transaction Ready" header
- Decode basic info from XDR if possible, or show "Sign to proceed"
- "Approve ✓" button (green) and "Reject ✗" button (red)
- Loading state while signing
- Shows Stellar explorer link after successful submission

FILE 4: components/ChatInput.tsx
Props: { onSend: (message: string) => void, disabled: boolean }
- Text input with placeholder "Ask me anything... (e.g., 'lend my USDC')"
- Send button
- Handles Enter key press
- Disabled state when AI is responding
- Clears input after send

Use shadcn/ui components (Button, Input, Card, Badge) where appropriate.
TypeScript with proper prop types.
```

---

## PROMPT 8 — Main Page

```
Generate: app/page.tsx

This is the main chat page. Requirements:

Layout:
- Full height page (h-screen)
- Top: App header with name "StarDeFi" and WalletConnect component
- Middle: Scrollable chat message list (flex-1, overflow-y-auto)
- Bottom: ChatInput component (fixed/sticky)

Behavior:
1. On load, if Freighter is installed and previously connected, auto-reconnect
2. When user sends a message:
   a. Add user message to chat store
   b. Set loading to true
   c. POST to /api/chat with messages, walletAddress, balances
   d. Add AI response to chat store
   e. If response has pendingXDR, show TransactionPreview in the AI message
   f. Set loading to false
3. When user approves a transaction:
   a. Call signXDR() from freighter connector
   b. Submit to Stellar via horizonServer.submitTransaction()
   c. Show success/failure in chat
   d. Refresh balances
4. Auto-scroll to bottom when new messages appear
5. Show loading indicator (animated dots) while AI is thinking

Use useWalletStore and useChatStore hooks.
Include an initial welcome message from the AI.
Mobile-responsive layout.
Dark or clean light theme — your choice, but make it look professional.
```

---

## PROMPT 9 — Final Polish & Error Handling

```
Now review all the generated code and add the following:

1. lib/stellar/submit.ts
   - submitTransaction(signedXDR: string): Promise<{hash: string, explorerUrl: string}>
   - Use horizonServer.submitTransaction()
   - Return Stellar Testnet explorer URL: https://testnet.steexp.com/tx/{hash}
   - Handle common errors: tx_bad_auth, op_underfunded, etc.
   - Map errors to human-readable messages

2. Add error boundaries to the main page:
   - Wallet connection failures → "Freighter wallet not found. Please install it from freighter.app"
   - Network errors → "Network issue. Please try again."
   - Insufficient balance → "You don't have enough [TOKEN] for this transaction."

3. Add a README.md with:
   - Project title and one-liner description
   - Live demo link (placeholder)
   - What it does (3 bullet points)
   - How it works (1 paragraph on LLM function calling)
   - Tech stack list
   - Setup instructions (clone, install, env vars, npm run dev)
   - Hackathon context (Stellar Hacks, DoraHacks)

4. Add .gitignore with standard Next.js entries + .env.local

Output each file separately, labeled clearly.
```

---

## PROMPT 10 — Demo Prep Checklist

```
Generate a DEMO_CHECKLIST.md file that I can use on demo day.

It should include:

Pre-demo setup (30 mins before):
- [ ] Funded testnet wallet items (what to have ready)
- [ ] Browser setup (clear cookies, disable notifications, etc.)
- [ ] Freighter wallet configured for testnet
- [ ] App deployed and loaded
- [ ] Backup demo video recorded and ready

The 3 demo flows with exact steps:
1. Lending demo (primary, 60 seconds)
2. Swap demo (secondary, 30 seconds)  
3. Balance query (quick win, 10 seconds)

If something goes wrong:
- If Freighter popup doesn't appear → [what to do]
- If transaction fails → [what to do]
- If API is down → [what to do]
- If live demo crashes → [pivot to backup video]

Pitch timing guide:
- Mark exactly when to open the laptop, when to type, when to speak

Also generate a TESTNET_SETUP.md explaining:
- How to get testnet XLM from the Stellar Friendbot
- How to get testnet USDC
- How to configure Freighter for testnet
- How to verify transactions on the testnet explorer
```

---

## USAGE ORDER SUMMARY

```
1. Feed all of files 00-04 to Kimi at once (or in sequence if context is limited)
2. Run PROMPT 0 to verify Kimi understands the project
3. Run PROMPT 1 → save output as package.json, .env.local, etc.
4. Run PROMPT 2 → save as lib/stellar/client.ts and connectors/freighter.ts
5. Run PROMPT 3 → save as store/wallet.ts and store/chat.ts
6. Run PROMPT 4 → save as lib/tools/wallet.ts, soroswap.ts, blend.ts, index.ts
7. Run PROMPT 5 → save as lib/tools/definitions.ts
8. Run PROMPT 6 → save as app/api/chat/route.ts
9. Run PROMPT 7 → save as components/*.tsx
10. Run PROMPT 8 → save as app/page.tsx
11. Run PROMPT 9 → polish pass + README
12. Run PROMPT 10 → demo prep materials

After each file is generated:
- Test compile: npm run build
- Fix any TypeScript errors before moving to next prompt
- Test each feature in isolation before wiring them together
```

---

## TIPS FOR GETTING BEST RESULTS FROM KIMI

1. **Keep context fresh**: If Kimi forgets context, re-paste the relevant sections (00–03 are most important)
2. **Be explicit about interfaces**: If Kimi generates a slightly different interface name, tell it to match exactly what was defined in earlier files
3. **Ask for complete files**: Always say "give me the complete file, no truncation"
4. **Ask for imports**: Kimi sometimes omits imports — add "include all import statements" to each prompt
5. **Iterate on Blend specifically**: Blend SDK is the hardest part. Expect to iterate 2-3x on blend.ts
6. **Test swap first**: Soroswap (swap) is simpler than Blend (lending). Get swap working perfectly first, then tackle Blend.

---

## MOST CRITICAL THING

The ONE thing that will make you win or lose: **real transactions**.

Onboardr failed because their swaps were mocked. Your swaps and deposits must hit real contracts on testnet. When a judge asks "is this real?", you must be able to show the transaction hash on the Stellar explorer.

**Priority if running out of time**:
1. Real swap through Soroswap ← do this no matter what
2. Blend pool listing (read-only, no tx) ← easy win
3. Real Blend deposit ← bonus, but attempt it

A working real swap + read-only Blend comparison + working wallet connect is a strong submission.
