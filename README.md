# Travel Agent Mobile App

A comprehensive travel booking and management application with integrated TRAVL token features.

## Features

### Travel Management
- Book flights, hotels, and activities
- View and manage bookings
- Real-time travel updates
- Itinerary planning
- Travel recommendations

### Token Management
- View TRAVL token balance and metrics
- Stake tokens for rewards
- Swap tokens with other cryptocurrencies
- Track token activities
- Claim booking and staking rewards
- View token distribution and vesting

## Getting Started

### Prerequisites
- Node.js 18+
- Yarn or npm
- React Native development environment
- iOS/Android development tools

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/travelagent.git

# Install dependencies
cd travelagent_mobile
yarn install

# Install pods for iOS
cd ios && pod install && cd ..

# Set up environment variables
cp .env.example .env
```

### Environment Variables
```
TRAVL_TOKEN_ADDRESS=
UNISWAP_ROUTER_ADDRESS=
WETH_ADDRESS=
USDC_ADDRESS=
DAI_ADDRESS=
USDT_ADDRESS=
```

### Running the App
```bash
# Start Metro bundler
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android
```

## Testing
```bash
# Run unit tests
yarn test

# Run E2E tests
yarn e2e:build
yarn e2e:test
```

## Architecture

### Token Management System
- `TokenDashboardScreen`: Main token interface
- `TokenStakingScreen`: Staking interface
- `TokenSwapScreen`: Token swap interface
- `TokenActivityScreen`: Activity history
- `TokenMetricsScreen`: Token metrics and charts
- `TokenRewardsScreen`: Rewards management

### Components
- `TokenMetricsCard`: Display token statistics
- `TokenInput`: Amount input with validation
- `RewardCard`: Display reward information
- `TokenDistributionChart`: Token allocation visualization
- `SwapRoute`: Display swap routing
- `PriceImpact`: Show trade impact

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security
See [SECURITY.md](./SECURITY.md) for security policies and procedures.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
