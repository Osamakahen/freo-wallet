# Freo Wallet

A modern, secure, and user-friendly Ethereum wallet built with React, TypeScript, and Viem.

## Features

- 🔐 Secure key management with mnemonic phrase support
- 💰 Native token (ETH) and ERC20 token support
- 🔄 Real-time transaction monitoring
- 🛡️ Built-in security features
- 📱 Responsive design
- 🌐 Multi-chain support (Ethereum Mainnet and testnets)
- 🔍 Transaction history and analytics
- 🎨 Modern UI with dark/light mode

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Ethereum**: Viem (for all Ethereum interactions)
- **State Management**: React Context + Custom Hooks
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MetaMask or other Web3 wallet (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Osamakahen/freo-wallet.git
   cd freo-wallet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

### Core Components

1. **Wallet Management**
   - Secure key storage and management
   - Account creation and import
   - Balance tracking

2. **Transaction System**
   - Transaction preparation and signing
   - Gas estimation and optimization
   - Real-time transaction monitoring
   - Transaction history

3. **Token Management**
   - Native token (ETH) support
   - ERC20 token support
   - Token price tracking
   - Token approval system

4. **Security**
   - Encrypted key storage
   - Secure transaction signing
   - Phishing protection
   - Session management

### Key Classes

- `Wallet`: Core wallet functionality
- `TransactionManager`: Transaction handling
- `TokenManager`: Token operations
- `KeyManager`: Secure key management
- `EVMAdapter`: Ethereum network interaction

## Development

### Code Structure

```
src/
├── components/     # React components
├── core/          # Core wallet functionality
│   ├── wallet/    # Wallet management
│   ├── transaction/ # Transaction handling
│   ├── token/     # Token management
│   └── network/   # Network adapters
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
└── utils/         # Utility functions
```

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Security

- Private keys are never stored in plain text
- All sensitive operations require user confirmation
- Regular security audits
- Phishing protection mechanisms

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Viem](https://viem.sh/) for Ethereum interaction
- [React](https://reactjs.org/) for the UI framework
- [TailwindCSS](https://tailwindcss.com/) for styling
