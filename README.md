# 🗳️ Liquid Democracy - Network States Governance

A revolutionary governance system combining direct democracy, delegation, and quadratic voting for truly decentralized decision-making. Built for the future of network states and DAOs.

![Liquid Democracy](https://img.shields.io/badge/Liquid-Democracy-blue?style=for-the-badge&logo=ethereum)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange?style=for-the-badge&logo=solidity)
![Base](https://img.shields.io/badge/Base-Sepolia-0052FF?style=for-the-badge&logo=base)

## ✨ Features

### 🏛️ **Liquid Democracy**
- Delegate your voting power to trusted community members
- Retain the ability to vote directly when needed
- Dynamic delegation chains with reputation tracking

### 🛡️ **Veto Mechanism**
- Strong opposition can pause proposals with a 10% veto threshold
- Prevents controversial decisions from being executed
- Community-driven safety mechanism

### 👥 **Proxy Voting**
- Assign proxies for offline voting
- Maintain continuous participation
- Time-limited proxy assignments

### 📊 **Quadratic Voting**
- Vote with credits that scale quadratically
- Prevents concentration of power
- Fair and democratic voting system

### 🏆 **Reputation System**
- Build reputation through consistent voting patterns
- Successful delegations increase reputation
- Reputation affects voting power calculations

### 🎯 **Expertise-Based Voting**
- Category-specific expertise tracking
- Specialized voting power for domain experts
- Balanced decision-making across different areas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or any Web3 wallet
- Base Sepolia testnet ETH

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd liquid-democracy-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:3000`

### Smart Contract Deployment

The smart contracts are already deployed on Base Sepolia testnet:

- **Liquid Democracy Contract**: `0x8E568c12530E39490B624A6f42c03b1D48d747cf`
- **CITY Token Contract**: `0xf7f12D1748E56b966b91566b280772c948B739e5`

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **RainbowKit** - Beautiful wallet connection UI
- **Wagmi** - React hooks for Ethereum
- **Ethers.js 5** - Ethereum library for interacting with smart contracts

### Smart Contract Features
- **ReentrancyGuard** - Protection against reentrancy attacks
- **Quadratic Voting** - Credits scale quadratically with voting power
- **Delegation System** - Liquid democracy with reputation tracking
- **Veto Mechanism** - Community-driven proposal pausing
- **Proxy Voting** - Offline voting support
- **Expertise Tracking** - Category-based voting power

## 📱 User Interface

### 🎨 **Modern Design**
- Glass morphism effects with beautiful gradients
- Dark theme optimized for long viewing sessions
- Responsive design that works on all devices
- Smooth animations and micro-interactions

### 🔧 **Key Pages**
- **Home** - Landing page with feature overview
- **Dashboard** - Overview of governance activity
- **Proposals** - Browse and vote on proposals
- **Create Proposal** - Submit new governance proposals
- **Governance** - Manage delegations and proxies
- **Profile** - View your activity and achievements

## 🎯 How It Works

### 1. **Registration**
Users register as citizens to participate in governance.

### 2. **Proposal Creation**
Citizens can create proposals in different categories:
- Budget
- Policy
- Infrastructure
- Other

### 3. **Voting Process**
- **Quadratic Voting**: Credits scale quadratically
- **Expertise Bonus**: Category-specific expertise increases voting power
- **Reputation Bonus**: Higher reputation provides additional credits
- **Delegation Bonus**: Long-term delegations provide time bonuses

### 4. **Delegation**
- Delegate voting power to trusted community members
- Maintain ability to vote directly
- Build reputation through successful delegations

### 5. **Veto Mechanism**
- 10% of citizens can veto a proposal
- Vetoed proposals are paused for review
- Community-driven safety mechanism

### 6. **Execution**
- Proposals with majority support are executed
- Results are permanently recorded on-chain
- Proposers receive rewards for successful proposals

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_CONTRACT_ADDRESS=0x8E568c12530E39490B624A6f42c03b1D48d747cf
VITE_TOKEN_ADDRESS=0xf7f12D1748E56b966b91566b280772c948B739e5
VITE_CHAIN_ID=84532
VITE_RPC_URL=https://sepolia.base.org
```

### Network Configuration
The app is configured for Base Sepolia testnet:
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia-explorer.base.org

## 🧪 Testing

### Smart Contract Testing
```bash
npm run test
```

### Frontend Testing
```bash
npm run test:ui
```

## 📊 Analytics & Monitoring

The application includes comprehensive analytics:
- Proposal success rates
- Voting participation
- Delegation patterns
- Reputation distribution
- User engagement metrics

## 🔒 Security Features

- **Reentrancy Protection** - Prevents reentrancy attacks
- **Input Validation** - Comprehensive parameter validation
- **Access Control** - Role-based permissions
- **Emergency Pause** - Admin can pause critical functions
- **Veto Mechanism** - Community-driven safety

## 🌟 Hackathon Features

This project was built for hackathon success with:

### 🎨 **Stunning UI/UX**
- Modern glass morphism design
- Smooth animations and transitions
- Responsive and accessible
- Professional color scheme

### ⚡ **Performance**
- Optimized React components
- Efficient state management
- Fast loading times
- Smooth interactions

### 🔗 **Full Web3 Integration**
- Seamless wallet connection
- Real-time blockchain updates
- Transaction status tracking
- Error handling and recovery

### 📱 **Mobile-First Design**
- Responsive layout
- Touch-friendly interactions
- Optimized for mobile wallets
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** - Smart contract security libraries
- **RainbowKit** - Beautiful wallet connection UI
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first CSS framework
- **Base Network** - Scalable Ethereum L2

## 📞 Support

For support, email support@liquiddemocracy.com or join our Discord community.

---

**Built with ❤️ for the future of decentralized governance** 