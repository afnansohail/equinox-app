# Equinox - PSX Portfolio Tracker

A modern PSX (Pakistan Stock Exchange) portfolio tracker mobile app built with Expo/React Native. Features real-time stock data scraping from the official PSX Data Portal (dps.psx.com.pk), portfolio management, and a beautiful dark-themed UI.

## Features

- **Portfolio Management**: Track your PSX stock holdings with real-time valuations
- **Live Stock Data**: Real-time stock prices scraped from the official PSX Data Portal
- **Wishlist**: Add stocks to your watchlist for easy tracking
- **Transaction History**: Record and view all your buy/sell transactions
- **Beautiful UI**: Modern dark theme with shadcn-inspired design
- **Offline Support**: Data is cached locally for offline access
- **Pull to Refresh**: Update stock prices on demand

## Screenshots

```
Dashboard → Portfolio Overview → Top Holdings
Markets → All Stocks → Wishlist Tab
Stock Detail → Price Chart → Add to Wishlist
Add Transaction → Transaction History
```

## Tech Stack

- **Frontend**: Expo SDK 52, React Native, TypeScript
- **State Management**: Zustand, React Query
- **UI**: NativeWind (Tailwind CSS), Victory Native (Charts)
- **Backend**: Supabase (PostgreSQL + Auth)
- **API**: Vercel Serverless Functions (Web Scraping)
- **Navigation**: React Navigation v6

## Quick Start

### Prerequisites

- Node.js 18+
- Expo Go app on your Android device
- Supabase account (free tier)
- Vercel account (free tier)

### 1. Clone & Install Dependencies

```bash
cd equinox-app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the database schema:
   ```sql
   -- Run database/schema.sql
   -- Then run database/seed-stocks.sql
   ```
3. Enable Anonymous Auth:
   - Go to Authentication > Providers
   - Enable "Anonymous Sign-in"
4. Copy your project URL and anon key from Settings > API

### 3. Set Up Vercel (Scraper API)

```bash
cd equinox-scraper-api
npm install
npm install -g vercel
vercel login
vercel deploy
```

Note your deployment URL (e.g., `https://equinox-scraper-api.vercel.app`)

### 4. Configure Environment

Create `.env` in the equinox-app folder:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_VERCEL_API_URL=https://your-scraper.vercel.app
```

### 5. Start Development Server

```bash
npm start
```

Scan the QR code with Expo Go on your Android device.

## Project Structure

```
equinox-app/
├── App.tsx                 # App entry point
├── src/
│   ├── components/
│   │   ├── portfolio/      # Portfolio-specific components
│   │   ├── shared/         # Reusable components (Loading, Error, Empty states)
│   │   └── ui/             # Base UI components (Button, Card, Badge, Input)
│   ├── constants/
│   │   └── theme.ts        # Colors and theme styles
│   ├── hooks/
│   │   ├── usePortfolio.ts # Portfolio data hooks
│   │   ├── useStocks.ts    # Stock data hooks
│   │   └── useWishlist.ts  # Wishlist hooks
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   ├── MarketsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── StockDetailScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   └── TransactionHistoryScreen.tsx
│   ├── services/
│   │   ├── api.ts          # API layer with Supabase and scraper calls
│   │   └── supabase.ts     # Supabase client
│   └── stores/
│       └── authStore.ts    # Zustand auth store
├── database/
│   ├── schema.sql          # Complete database schema
│   └── seed-stocks.sql     # Initial PSX stock symbols
└── psx-scraper-api/        # Alternative TypeScript API (if needed)

equinox-scraper-api/        # Main Vercel scraper API
├── api/
│   ├── scrape-stock.js     # Single stock scraper
│   └── scrape-all-stocks.js # Bulk stock scraper
├── package.json
└── vercel.json
```

## API Endpoints

### Scraper API (Vercel)

- `GET /api/scrape-stock?symbol=OGDC` - Scrape single stock data
- `POST /api/scrape-all-stocks` - Scrape multiple stocks
  - Body: `{ "symbols": ["OGDC", "EFERT", "LUCK"] }`

### Data Source

Stock data is scraped from the official [PSX Data Portal](https://dps.psx.com.pk/company/OGDC), which provides:

- Current price
- Previous close / LDCP
- Change value and percent
- Open, High, Low prices
- Volume
- 52-week high/low
- Market cap
- P/E Ratio
- Sector information
- Company profile

## Database Schema

### Tables

- **stocks** - All PSX listed stocks with current prices
- **portfolio_holdings** - User's stock holdings
- **transactions** - Buy/sell transaction history
- **wishlist** - User's watchlist
- **user_settings** - App preferences
- **stock_prices_history** - Historical prices (for charts)

See `database/schema.sql` for complete schema with RLS policies.

## Development

### Running on Physical Device

1. Install Expo Go from Play Store
2. Ensure phone and computer are on same WiFi
3. Run `npm start`
4. Scan QR code with Expo Go

### Building Production APK

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

### Tunnel Mode (If QR Doesn't Work)

```bash
npx expo start --tunnel
```

## Troubleshooting

### Stock data not loading

- Check if Vercel API is deployed correctly
- Verify environment variables in `.env`
- Check Supabase RLS policies are enabled

### Authentication issues

- Enable Anonymous Sign-in in Supabase Dashboard
- Check Supabase URL and anon key

### Metro bundler issues

```bash
npx expo start --clear
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Acknowledgments

- [PSX Data Portal](https://dps.psx.com.pk) for official stock data
- [Supabase](https://supabase.com) for backend infrastructure
- [Expo](https://expo.dev) for React Native tooling
