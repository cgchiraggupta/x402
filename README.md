# StarDeFi AI - Stellar DeFi Assistant

> Interact with Stellar DeFi through plain English. No crypto expertise required.

[![Stellar](https://img.shields.io/badge/Stellar-7D00FF?logo=stellar&logoColor=white)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-00A67E)](https://deepseek.com)

## 🎯 What It Does

**StarDeFi AI** is a ChatGPT-style assistant that lets anyone interact with **Stellar blockchain DeFi** through natural language:

- **Type**: "lend my USDC at the best rate"
- **AI finds**: Best Blend lending pool (10.2% APR)
- **AI builds**: Real blockchain transaction
- **You approve**: One click in Freighter wallet
- **Done**: Funds deposited, earning yield

## 🚀 Live Demo

[Demo Video](https://example.com/demo) | [Live App](https://stellar-defi-ai.vercel.app)

## ✨ Features

### 🤖 AI-Powered DeFi
- **Natural language interface** - Type commands in plain English
- **LLM Function Calling** - AI doesn't just talk, it executes real transactions
- **Multi-protocol support** - Blend lending + Soroswap DEX

### 🔐 Wallet Integration
- **Freighter wallet** - One-click connection
- **Real transactions** - Builds and signs actual XDR transactions
- **Balance display** - Real-time portfolio tracking

### 💸 DeFi Actions
- **Token swaps** - XLM ↔ USDC ↔ BTC ↔ ETH via Soroswap
- **Lending/borrowing** - Deposit to Blend pools for yield
- **Portfolio management** - Check balances, values, earnings

## 🏗️ Architecture

```
User → Natural Language → AI Assistant → Stellar Transaction → Wallet Sign → On-chain Execution
```

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **AI**: DeepSeek API with Function Calling
- **Blockchain**: @stellar/stellar-sdk + @stellar/freighter-api
- **State**: Zustand
- **DeFi**: Soroswap API + Blend Protocol
- **Network**: Stellar Testnet (5s finality, $0.00001 fees)

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+

# Install Freighter wallet (browser extension)
# https://www.freighter.app/
```

### 2. Clone & Install
```bash
git clone https://github.com/cgchiraggupta/x402.git
cd x402
npm install
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your API keys
# Get DeepSeek API key: https://platform.deepseek.com/api_keys
```

### 4. Get Testnet Funds
```bash
# 1. Install Freighter wallet
# 2. Switch to Testnet in Freighter settings
# 3. Get free XLM: https://laboratory.stellar.org/#account-creator?network=test
# 4. Create USDC trustline (issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
```

### 5. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

## 📖 Usage Guide

### Connect Wallet
1. Click "Connect Freighter Wallet"
2. Approve connection in Freighter popup
3. See your balances and portfolio value

### Try These Commands
```bash
# Check portfolio
"What's my portfolio worth?"
"How much USDC do I have?"

# Swap tokens
"Swap 50 XLM to USDC"
"Exchange 100 USDC for XLM"

# Lend for yield
"Lend my USDC at the best rate"
"Deposit 100 USDC to earn interest"
"Show me all lending pools"

# Advanced
"Swap half my XLM to USDC and lend the rest"
"What are the current swap rates?"
```

### Transaction Flow
```
1. Type command → "lend 100 USDC"
2. AI finds best pool → "USDC-XLM pool: 10.2% APR"
3. AI builds transaction → Shows preview
4. You approve → Freighter popup appears
5. Sign transaction → Submitted to Stellar
6. Confirmed → "✅ 100 USDC deposited, earning 10.2% APR"
```

## 🏗️ Project Structure

```
stellar-defi-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/chat/route.ts   # AI chat endpoint
│   │   └── page.tsx           # Main chat interface
│   ├── components/            # React components
│   │   ├── ChatInput.tsx      # Message input
│   │   ├── ChatMessage.tsx    # Chat bubbles
│   │   ├── TransactionPreview.tsx # TX preview
│   │   └── WalletConnect.tsx  # Wallet connection
│   ├── connectors/            # Wallet connectors
│   │   └── freighter.ts       # Freighter wallet API
│   ├── lib/                   # Core logic
│   │   ├── stellar/           # Stellar SDK setup
│   │   └── tools/             # AI function tools
│   └── store/                 # Zustand stores
│       ├── chat.ts            # Chat state
│       └── wallet.ts          # Wallet state
├── docs/                      # Project documentation
├── public/                    # Static assets
└── package.json              # Dependencies
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Adding New Tools
1. Create tool in `src/lib/tools/`
2. Add to `src/lib/tools/definitions.ts`
3. Import in `src/app/api/chat/route.ts`
4. Add to switch statement in execute_tool

### Testing Transactions
```bash
# Use Stellar Testnet
# Test with small amounts first (10 XLM, 10 USDC)
# Check transaction on explorer: https://stellar.expert/explorer/testnet
```

## 📚 Documentation

### Core Concepts
- **XDR**: Stellar transaction format (what gets signed)
- **Horizon API**: Stellar blockchain data API
- **Soroban RPC**: Smart contract interaction
- **LLM Function Calling**: AI calling JavaScript functions

### API Reference
- **Soroswap API**: `https://api.soroswap.finance`
- **Stellar Horizon**: `https://horizon-testnet.stellar.org`
- **DeepSeek API**: `https://api.deepseek.com`

### Error Handling
- **Insufficient balance**: AI warns before building TX
- **Network errors**: Retry with exponential backoff
- **User rejection**: Graceful fallback to chat

## 🏆 Hackathon Features

### MVP (Must Have)
- [x] Wallet connect + balance display
- [x] AI chat with swap execution
- [x] AI chat with Blend lending
- [x] Real on-chain transactions

### Bonus Features
- [ ] x402 integration (AI agent payments)
- [ ] Multi-action commands
- [ ] Transaction history
- [ ] Auto-strategy suggestions

## 🔒 Security

### Best Practices
- **Testnet only** for development
- **No private keys** stored - wallet signs locally
- **Transaction simulation** before signing
- **Input validation** on all user commands

### Risk Mitigation
- **Slippage protection** (default 0.5%)
- **Minimum receive amounts**
- **Pool utilization checks** (<95%)
- **Balance verification** before transactions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use shadcn/ui components
- Write comprehensive docs
- Add tests for new features

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **Stellar Development Foundation** for the amazing blockchain
- **DeepSeek** for powerful AI capabilities
- **Freighter team** for the best Stellar wallet
- **Soroswap & Blend** for DeFi infrastructure

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/cgchiraggupta/x402/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cgchiraggupta/x402/discussions)
- **Email**: chiraggupta@example.com

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel
```bash
DEEPSEEK_API_KEY=sk-...
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## 📊 Roadmap

### Phase 1: Hackathon MVP ✅
- Basic swap and lending
- Freighter integration
- DeepSeek AI assistant

### Phase 2: Post-Hackathon
- x402 integration for AI payments
- Mainnet deployment
- Stellar Community Fund application

### Phase 3: Production
- Multi-wallet support (Lobstr, Albedo)
- Advanced strategies (DCA, auto-rebalance)
- Mobile app (React Native)

---

**Built with ❤️ for the Stellar Hacks hackathon**

*Interact with DeFi like never before. Just type what you want.*
