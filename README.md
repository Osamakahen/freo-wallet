# Freo Wallet - Seamless dApp Navigation

Freo Wallet is a browser extension wallet that aims to solve one of the biggest pain points in the current Web3 user experience: the need to repeatedly connect and authenticate when moving between different dApps.

## Key Features

- **Persistent Sessions**: Connect once and navigate seamlessly between dApps without reconnecting
- **Network State Preservation**: Maintain your selected network when moving between applications
- **Per-dApp Preferences**: Remember user preferences for each connected application
- **User-Controlled Permissions**: Control which dApps can auto-connect to your wallet

## Implementation Approach

This proof of concept implements a session management system that allows for persistent wallet connections across dApps, focusing on these key components:

### Session Management

The `SessionService` provides a central store for maintaining connection state, including:
- Connected addresses
- Selected networks per dApp
- Auto-connect preferences
- Connection history

### Injected Provider

An enhanced EIP-1193 compliant provider is injected into web pages, which:
- Auto-initializes from saved sessions
- Maintains connection state across page navigation
- Synchronizes account and network changes

### Background Script

The background script acts as the coordinator, which:
- Manages sessions across different tabs and domains
- Handles lifecycle events for connections
- Synchronizes state between the wallet UI and dApps

### User Interface Components

Several components have been created to support the user experience:
- `ConnectWallet` - Enhanced connect button with session controls
- `SessionManager` - Interface for managing dApp connections
- `NetworkSelector` - Network switching with per-dApp preferences

## How It Works

1. When a user connects to a dApp, a session is created in the `SessionService`
2. The session includes the connected address, selected network, and user preferences
3. When the user visits another dApp where they've connected before, the wallet auto-connects using the saved session
4. If the user switches networks, the preference is saved for that specific dApp
5. When returning to any connected dApp, the wallet remembers the user's preferred network for that particular application

## Code Structure

```
src/
├── services/
│   └── SessionService.ts      # Core session management functionality
├── inject/
│   └── provider.ts            # Enhanced Web3 provider for dApp integration
├── background/
│   └── background.ts          # Background script for cross-dApp coordination
├── content/
│   └── content-script.ts      # Bridge between dApp and extension
├── components/
│   ├── ConnectWallet.tsx      # Wallet connection component
│   ├── SessionManager.tsx     # Session management interface
│   └── NetworkSelector.tsx    # Network selection component
├── contexts/
│   └── WalletContext.tsx      # React context for wallet state
└── config/
    └── networks.ts            # Network configuration
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/freo-wallet.git
   cd freo-wallet
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Build the extension:
   ```bash
   npm run build
   # or
   yarn build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder from the project

## Usage

1. Click the Freo Wallet icon to open the popup
2. Connect to any dApp as you normally would
3. Navigate to another dApp and experience automatic connection
4. Manage your connections in the "Connected dApps" section of the wallet

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm run test` - Run tests
- `npm run lint` - Run linter

### TypeScript Support

The project uses TypeScript for type safety and better development experience. All new code should be written in TypeScript.

## Future Improvements

While this proof of concept demonstrates the core functionality, a full middleware implementation would include:

1. More robust session security with timeouts and verification
2. Formalized protocol for dApp-to-wallet communication
3. Enhanced state synchronization between components
4. Advanced permission management for dApp integrations
5. Performance optimizations for state persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- EIP-1193 for the Ethereum Provider JavaScript API
- The Web3 community for inspiration and feedback

---

This proof of concept demonstrates the feasibility of persistent wallet sessions while we work toward the full middleware implementation.
