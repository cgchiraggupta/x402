# Stellar DeFi AI Assistant — Complete Project Context
> Feed this to Kimi/Zed LLM first. It is the master briefing document.

---

## What You Are Building

A ChatGPT-style AI assistant that lets anyone interact with **Stellar blockchain DeFi** through plain English.

**One-liner**: Type "lend my USDC at the best rate" → AI finds the best Blend pool → constructs a real blockchain transaction → user signs with one click → done.

**Hackathon**: Stellar Hacks (DoraHacks)  
**Track**: DeFi / Stellar Community Fund  
**Deadline context**: 7-day sprint

---

## The Core Innovation

Most AI chatbots just **talk**. This one **does things**.

The key technology is **LLM Function Calling (Tools)**:
- AI doesn't just generate text — it has "tools" (JS functions) that connect to real Stellar smart contracts
- When user says "swap 50 XLM to USDC", the AI:
  1. Recognizes intent → swap
  2. Calls `get_soroswap_quote(XLM, USDC, 50)` → real-time pricing
  3. Calls `build_swap_tx()` → constructs actual blockchain transaction (XDR format)
  4. Returns XDR for user to sign via Freighter wallet

This is exactly what kalepail (Stellar core contributor) demonstrated in his AI agent tutorial — but **nobody has shipped a working version of this yet on Stellar**.

---

## The Problem (Why This Needs to Exist)

### Problem 1: DeFi is Stupidly Confusing
To earn interest on USDC today, a user must:
1. Buy crypto on exchange (Coinbase, WazirX)
2. Set up self-custody wallet (Freighter) — write down 24-word seed phrase
3. Transfer crypto (wrong network = money gone forever)
4. Navigate to Blend lending protocol
5. Understand pools, APR, collateral ratios, liquidation risks
6. Approve tx, pay gas, sign with wallet extension

**Key Stat**: 60% of crypto owners want to use DeFi but give up. This is the "GitHub Problem" — solutions work technically but are incomprehensible to normal humans.

### Problem 2: Fear of Losing Money
- One wrong click = money gone forever
- No customer support, no bank to reverse
- $3.4B stolen in crypto in 2025 alone
- Biggest barrier to DeFi adoption = pure fear

### Problem 3: Information Overload
- Hundreds of DeFi protocols with different rates, risks, rules
- No way to manually track which pool has the best rate
- No way to know if a protocol is safe

### Problem 4: Stellar-Specific Gap
- Stellar has $90M+ locked in Blend protocol alone
- No simple interface to interact with it
- Every tool assumes the user already knows what they're doing

### Target Users
| User Type | Pain |
|-----------|------|
| Crypto beginners | Want to earn yield on USDC/XLM but can't navigate DeFi |
| Indian freelancers | Have USDC from international clients, don't know how to put it to work |
| DeFi-curious devs | Understand code but no time to track 10 protocols |
| Stellar community | Loyal to network but DeFi tools sparse vs Solana/ETH |

---

## The Solution — User Flow

| Step | User Sees | Behind the Scenes |
|------|-----------|-------------------|
| 1. Connect | Clicks "Connect Wallet" | App reads wallet address + balances via Stellar SDK |
| 2. Ask | Types: "Lend 100 USDC at the best rate" | Message sent to AI with wallet context |
| 3. AI Thinks | "Found 3 Blend pools. Best rate is 10.2% APR in USDC-XLM pool" | LLM calls `get_blend_pools()` tool, compares APRs |
| 4. AI Acts | Shows tx preview: amount, pool, expected returns | LLM calls `build_deposit_tx()`, constructs XDR |
| 5. User Signs | Clicks "Approve" in Freighter popup | Signed tx submitted to Stellar network |
| 6. Confirmed | "Done! 100 USDC deposited. Earning 10.2% APR." | Tx confirmed on-chain in ~5 seconds |

---

## Judging Criteria (What Matters)

| Criteria | Weight | Strategy |
|----------|--------|----------|
| Technical Innovation | 25% | LLM function calling + real Stellar transactions = nobody has shipped this |
| Completion Level | 25% | 3 features that WORK > 10 broken features. Live demo is everything |
| User Experience | 20% | Chat interface IS the UX — clean Next.js + shadcn/ui |
| Product-Market Fit | 20% | 60% of crypto users want DeFi but can't use it. $90M TVL = real demand |
| Presentation | 10% | Rehearsed 3-min pitch + live working demo + clean README |

**Key insight**: "MVP matters the most. Functions can be less, but whatever you build should WORK properly." — Sarthak Nimje (8x international blockchain hackathon winner)

---

## Why Stellar (Not Ethereum)

- 5-second finality
- Near-zero fees ($0.00001 per tx)
- Native USDC support
- No MEV/frontrunning risk
- **x402 protocol** for AI agent payments just launched March 2026 (Stellar-native)

---

## Competitive Landscape

### On Stellar (Direct Competitors)
| Project | Status | Why You Win |
|---------|--------|-------------|
| Onboardr/SoroAI | Dead since Aug 2025. Swaps are FAKE (mocked). Did NOT win hackathon. | Your AI executes REAL transactions |
| Loky | Grant application only. Never launched or built. | You have a working product |
| Verbex | Limited hackathon submission | You have broader coverage (Blend + Soroswap + balances) |

### On Other Chains (Proof the Concept Works)
| Project | Chain | What It Does |
|---------|-------|--------------|
| Griffain | Solana | Natural language DeFi: "make me a memecoin" → AI executes. Users love it. |
| Hey Anon | Multi-chain | AI agent for cross-chain DeFi. $180M+ market cap. |
| Neur | Solana | On-chain AI copilot, real-time tracking + auto-execution |

**Bottom line**: DeFAI is proven on Solana/ETH with hundreds of millions in market cap. Nobody has shipped it on Stellar. You're building the **Griffain of Stellar**.

---

## After the Hackathon

1. **Week 1-2**: Apply to Stellar Community Fund (SCF) — grants up to $150K in XLM
2. **Month 1**: x402 integration — AI pays for premium data autonomously
3. **Month 2**: Multi-protocol support — DeFindex vaults, XLM staking
4. **Month 3**: Launch on mainnet
5. **Ongoing**: Superteam bounties ($20-30K/year possible)

### x402 Secret Weapon
Stellar launched x402 on March 10, 2026 — a protocol letting AI agents pay for things autonomously using USDC. x402 Foundation includes Coinbase, Cloudflare, Google, Visa. Future potential:
- AI pays for premium API data feeds autonomously
- Charge users per-query via micropayments
- Integrate with Google's Agent Payments Protocol (AP2)
- Operate within programmable spending budgets

---

*This is the master overview. See other context files for tech stack, architecture, features, and code references.*
