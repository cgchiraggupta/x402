# Development Workflow

## 🚀 Quick Start Commands

```bash
# Clone repository
git clone git@github.com:cgchiraggupta/x402.git
cd x402

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your DeepSeek API key

# Run development server
npm run dev
```

## 📁 Project Structure

```
x402/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── chat/          # AI chat endpoint
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   ├── connectors/            # Wallet connectors
│   ├── lib/                   # Core libraries
│   │   ├── stellar/           # Stellar blockchain
│   │   └── tools/             # AI function tools
│   └── store/                 # Zustand stores
├── docs/                      # Documentation
├── public/                    # Static assets
└── package.json              # Dependencies
```

## 🔄 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: add tests
chore: maintenance
```

### Example Workflow
```bash
# Create feature branch
git checkout -b feature/add-new-token

# Make changes
git add .
git commit -m "feat: add BTC token support"

# Push to remote
git push origin feature/add-new-token

# Create Pull Request on GitHub
```

## 🧪 Testing Workflow

### 1. Local Testing
```bash
# Run development server
npm run dev

# Test wallet connection
# 1. Install Freighter extension
# 2. Switch to Testnet
# 3. Get testnet funds

# Test AI commands
# 1. "What's my portfolio worth?"
# 2. "Swap 10 XLM to USDC"
# 3. "Show me lending pools"
```

### 2. Transaction Testing
```bash
# Always test with small amounts first
# Check transaction on Stellar Explorer:
# https://stellar.expert/explorer/testnet

# Monitor console for errors
# Check browser DevTools → Console
```

### 3. AI Testing
```bash
# Test different command formats
# "swap 50 XLM to USDC"
# "exchange my XLM for USDC"
# "convert 100 XLM"

# Test error cases
# "swap 1000000 XLM" (insufficient balance)
# "swap XLM to INVALID" (invalid token)
```

## 🛠️ Development Workflow

### 1. Adding New Features

#### Add New Token Support
1. Add to `src/lib/tools/soroswap.ts`:
```typescript
const validTokens = ["XLM", "USDC", "BTC", "ETH", "NEW_TOKEN"];
```

2. Update tool definitions in `src/lib/tools/definitions.ts`:
```typescript
enum: ["XLM", "USDC", "BTC", "ETH", "NEW_TOKEN"]
```

3. Add price data in `src/lib/tools/wallet.ts`:
```typescript
} else if (balance.assetCode === "NEW_TOKEN") {
  usdValue = parseFloat(balance.balance) * tokenPrice;
}
```

#### Add New DeFi Protocol
1. Create new tool file: `src/lib/tools/newprotocol.ts`
2. Add to `src/lib/tools/index.ts`
3. Update `src/lib/tools/definitions.ts`
4. Add to `src/app/api/chat/route.ts`

### 2. Debugging

#### Common Issues
```bash
# Wallet not connecting
# → Check Freighter is installed and on Testnet
# → Check browser console for errors

# AI not responding
# → Check DeepSeek API key in .env.local
# → Check network tab for API errors

# Transactions failing
# → Check Stellar Explorer for error codes
# → Check balance is sufficient
# → Check network is Testnet
```

#### Debug Commands
```bash
# Check TypeScript errors
npm run type-check

# Check linting
npm run lint

# Check build
npm run build
```

## 📦 Deployment Workflow

### 1. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables on Vercel dashboard
# DEEPSEEK_API_KEY
# NEXT_PUBLIC_STELLAR_NETWORK
# NEXT_PUBLIC_HORIZON_URL
```

### 2. Production Checklist
- [ ] Update `.env.local` with production values
- [ ] Switch to Stellar Mainnet
- [ ] Update API endpoints
- [ ] Test with real funds (small amounts)
- [ ] Add error monitoring (Sentry, LogRocket)
- [ ] Add analytics (Google Analytics, Mixpanel)

### 3. Environment Variables
```bash
# Development (.env.local)
DEEPSEEK_API_KEY=dev_key
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET

# Production (Vercel)
DEEPSEEK_API_KEY=prod_key
NEXT_PUBLIC_STELLAR_NETWORK=PUBLIC
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org
```

## 🔧 Maintenance Workflow

### 1. Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update specific package
npm install package@latest

# Check security vulnerabilities
npm audit
```

### 2. Code Quality
```bash
# Run linter
npm run lint

# Fix linting errors
npm run lint -- --fix

# Type checking
npm run type-check

# Format code (if using Prettier)
npx prettier --write .
```

### 3. Performance Monitoring
```bash
# Build size analysis
npm run build
# Check .next/analyze/ for bundle analysis

# Lighthouse audit
# Use Chrome DevTools → Lighthouse
```

## 🚨 Emergency Procedures

### 1. Critical Bug Fix
```bash
# Create hotfix branch from main
git checkout -b hotfix/critical-bug main

# Fix the bug
git add .
git commit -m "fix: critical transaction bug"

# Merge to main and develop
git checkout main
git merge hotfix/critical-bug
git push origin main

git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

### 2. API Key Compromise
1. Rotate DeepSeek API key
2. Update `.env.local` and Vercel environment
3. Notify users if necessary

### 3. Security Incident
1. Freeze deployments
2. Investigate logs
3. Apply fixes
4. Deploy patches
5. Post-mortem analysis

## 📈 Monitoring & Analytics

### 1. Application Metrics
- User sessions
- Wallet connections
- Transaction success rate
- AI response time
- Error rates

### 2. Blockchain Metrics
- Transaction fees
- Confirmation times
- Network congestion
- Gas prices (if applicable)

### 3. Business Metrics
- Active users
- Retention rate
- Feature usage
- Revenue (if monetized)

## 🤝 Collaboration Workflow

### 1. Code Review Process
1. Create PR with clear description
2. Assign reviewers
3. Address review comments
4. Pass CI checks
5. Merge after approval

### 2. Documentation Updates
- Update README for new features
- Add JSDoc comments for functions
- Update API documentation
- Create changelog entries

### 3. Release Process
```bash
# Version bump
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Create release notes
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Deploy to production
vercel --prod
```

## 🎯 Best Practices

### Code Quality
- Write TypeScript with strict mode
- Use functional components with hooks
- Follow React best practices
- Write comprehensive tests

### Security
- Never commit secrets to git
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting

### Performance
- Code splitting for large bundles
- Image optimization
- Server-side rendering where appropriate
- Cache API responses

### User Experience
- Loading states for async operations
- Error boundaries for crashes
- Accessible UI components
- Mobile-responsive design

---

**Last Updated**: March 27, 2026  
**Maintainer**: @cgchiraggupta  
**Status**: Active Development