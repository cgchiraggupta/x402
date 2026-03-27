# Pitch Script & Judge Q&A Prep
> Feed this FIFTH. Use this for demo prep and presentation.

---

## 3-Minute Pitch Script

| Time | Section | What to Say |
|------|---------|-------------|
| 0:00–0:10 | **Hook** | "Stellar has $90 million locked in DeFi. But most people can't use it because the interfaces look like a spaceship cockpit." |
| 0:10–0:30 | **Problem** | "To earn interest on your USDC, you need to understand pools, collateral ratios, APRs, and navigate 5 different protocols. That's 6 steps, 3 different interfaces, and one wrong click loses everything. 60% of crypto holders want to use DeFi but give up because of this complexity." |
| 0:30–1:30 | **Solution + LIVE DEMO** | "Our AI assistant lets you do DeFi through conversation. Watch — I'll type: *lend my USDC at the best rate*." [DEMO] "The AI just found the best Blend pool at 10.2% APR, constructed the transaction, and I approved it with one click. Done in 8 seconds." |
| 1:30–2:15 | **How It Works** | "Under the hood, the AI has tools — JavaScript functions connected to real Stellar contracts. When I say swap or lend, it calls get_blend_pools(), compares rates, constructs the actual XDR transaction, and I sign with Freighter. Real blockchain transactions, not simulations." |
| 2:15–2:45 | **Why Now** | "Stellar just launched x402 for AI agent payments 2 weeks ago. SDF's roadmap is AI-native. The DeFAI market is growing 45% year-over-year. We're building on the future, not the past." |
| 2:45–3:00 | **Ask** | "We're applying to the Stellar Community Fund to make this the default way people interact with Stellar DeFi. Thank you." |

---

## Pro Tips for Pitch Delivery

1. **Rehearse 5+ times** — out loud, with a timer, in front of someone
2. **Prepare testnet wallet** with funds already in it before demo
3. **Have a backup video** in case live demo fails (network issues, Freighter glitch)
4. **Don't over-apologize** if something goes slightly wrong — keep moving
5. **The demo IS the pitch** — spend most energy making the demo work smoothly
6. **Clean browser before demo** — no notifications, no other tabs

---

## Judge Q&A — Full Answers

### Product-Market Fit Questions

**"Who is your target user?"**
> Crypto beginners who have USDC/XLM but find DeFi interfaces overwhelming. Also: Indian freelancers receiving international payments in USDC who want to earn yield but don't know where to start.

**"What problem are you solving?"**
> DeFi is unusable for normal people. 60% want to use it but can't navigate the complexity. We turn 6 confusing steps — buying crypto, setting up a wallet, finding a protocol, understanding pools, approving transactions — into one English sentence.

**"How big is this market?"**
> Stellar has $90M+ TVL in Blend alone. The global DeFAI (DeFi + AI) market is projected to surpass $10.9B in 2026 — a 45.8% growth rate. We're targeting the early adopter layer of Stellar's 200K active users.

**"Why would someone use this instead of going to Blend directly?"**
> Same reason people use Google Maps instead of reading a road atlas — it's faster, simpler, and you don't need to be an expert. The AI finds the best pool FOR you, constructs the transaction, and all you do is approve. You don't need to know what APR means.

---

### Technical Innovation Questions

**"What Stellar-specific features are you using?"**
> Stellar SDK for transaction building and XDR construction, Blend and Soroswap contract calls via Soroban RPC, Horizon API for real-time account data and balances, Freighter wallet API for signing, and the x402 protocol for future AI micropayments.

**"How does the AI actually construct transactions?"**
> OpenAI's function calling feature. We define "tools" — JavaScript functions that map to specific DeFi actions. When I say "swap", the AI calls `get_soroswap_quote()` to get real pricing, then calls `build_swap_tx()` to construct an actual XDR transaction. We use `simulateTransaction()` via Soroban RPC to verify it'll succeed before asking the user to sign.

**"Why Stellar and not Ethereum?"**
> 5-second finality vs 15 minutes on Ethereum. Near-zero fees ($0.00001 per tx vs $5-50 on ETH). Native USDC support. No MEV or frontrunning risk. And critically — x402, the AI agent payment protocol, just launched natively on Stellar 2 weeks ago. Stellar is being built for the AI agent economy.

**"Is the AI actually calling smart contracts, or is it mocked?"**
> Real contracts. The AI constructs real XDR transactions using the Stellar SDK. We call Blend and Soroswap via Soroban RPC. The user signs with Freighter and the transaction gets confirmed on-chain within 5 seconds. You can check the transaction hash on the Stellar explorer.

**"How is this different from a chatbot that just tells you what to do?"**
> Most AI chatbots just generate text — they tell you "go to Blend and deposit here". Ours takes action. The AI has tools that are actual JavaScript functions connected to real blockchain infrastructure. It doesn't just describe the transaction — it builds it and executes it.

---

### Completion and Business Questions

**"Can you show me a live demo?"**
> Yes — [Demo: type command → AI finds best pool → construct tx → sign with Freighter → confirmed on testnet]

**"How would you monetize this?"**
> Two paths: (1) Small protocol fee (0.1%) on each AI-executed trade — similar to how DEX aggregators work. (2) Premium subscription for advanced features like auto-rebalancing and strategy automation. Long-term: x402 micropayments for per-query pricing.

**"What happens after the hackathon?"**
> Apply immediately to the Stellar Community Fund for grants up to $150K in XLM. This hackathon demo becomes our proof-of-concept for the application. Then integrate x402 so the AI agent can pay for premium data feeds autonomously. Month 3: mainnet launch with real users.

**"Who are your competitors?"**
> On Stellar: Onboardr/SoroAI tried this — prototype, swaps were mocked/fake, didn't win the hackathon, dead since August 2025. Loky submitted a grant application but never built anything. On other chains: Griffain on Solana, Hey Anon multi-chain — both successful with hundreds of millions in market cap. We're bringing that proven concept to Stellar, which nobody has done yet.

**"What's your technical risk?"**
> Blend SDK complexity for Soroban contract interaction. We've mitigated this by using Stellar's native path payment operations as a fallback for swaps, while building toward full Blend contract integration.

---

## Demo Script (Step-by-Step)

**Setup before demo**:
- Testnet wallet pre-funded: 1000 XLM + 500 USDC
- App deployed and loaded in clean browser tab
- Freighter extension installed and wallet imported
- Connected to testnet

**Demo Flow 1 — Lending (Primary Demo)**:
1. "I'll type: *lend my USDC at the best rate*"
2. [AI calls get_blend_pools(), shows pool comparison]
3. [AI recommends USDC-XLM pool at 10.2% APR]
4. [Transaction preview appears: "Depositing 100 USDC → Blend, earning 10.2% APR"]
5. Click "Approve" → Freighter popup → Sign
6. AI confirms: "Done! 100 USDC deposited. You're now earning 10.2% APR."
7. Balance display updates live

**Demo Flow 2 — Swap (If Time)**:
1. "Now let me show you a swap: *swap 50 XLM to USDC*"
2. [AI gets Soroswap quote]
3. [Shows: "50 XLM → 8.23 USDC, price impact: 0.2%"]
4. Sign → Confirmed

**Demo Flow 3 — Balance Query (Quick)**:
1. "And I can just ask: *what's my portfolio worth?*"
2. [AI reads balances, shows formatted portfolio summary]

---

## Key Stats to Memorize

- **$90M+** — Blend TVL on Stellar
- **60%** — Crypto holders who want DeFi but give up (complexity)
- **$3.4B** — Crypto stolen in 2025 (fear/security barrier)
- **$10.9B** — DeFAI market projected 2026
- **45.8%** — DeFAI market growth rate
- **5 seconds** — Stellar transaction finality
- **$0.00001** — Stellar transaction fee
- **$150K** — Max Stellar Community Fund grant
- **March 10, 2026** — x402 launched on Stellar (2 weeks ago)
- **$180M+** — Hey Anon market cap (proof DeFAI works)

---

## The SCF Grant Application

After the hackathon, apply to Stellar Community Fund:
- **URL**: communityfund.stellar.org
- **Grant size**: Up to $150K in XLM
- **Your pitch**: "We're the first working DeFAI interface on Stellar. Hackathon demo proves the concept. We need funding to build to mainnet, get security audits, and acquire first 1000 users."
- **Track**: Developer Tooling / DeFi Infrastructure
- **Your proof**: Working hackathon demo + GitHub + Vercel deployment

---

*See 05_KIMI_PROMPTS.md for the exact prompts to give Kimi to generate each piece of code.*
