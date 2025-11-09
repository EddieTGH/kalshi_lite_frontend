# Kalshi Lite

A lightweight betting application built for my roommates's birthday party. Think [Kalshi](https://kalshi.com/), but simplified for casual betting among friends.

## Overview

Kalshi Lite is a simple, fun way for everyone to place bets on various actions that could occur at a party and see who comes out on top at the end of the night. Leaderboard tracks people's performance throughout the night. Built with Next.js, TypeScript, and Tailwind CSS.

## Key Features

### For Users

- **Browse & Place Bets**: View all available bets with real-time odds and place bets with your available balance
- **Manage Your Bets**: See all your active bets and remove them before they're locked
- **Live Leaderboard**: Track rankings of all players by total money (available + invested)
- **Simple Login**: 3-character password authentication (perfect for party settings - no complex accounts needed)
- **Mobile-First**: Fully responsive design optimized for phones

### For Admins

- **Create Custom Bets**: Add new prediction markets with custom odds and involved parties
- **Lock Betting**: Globally freeze all betting activity when needed
- **Resolve Bets**: End bets, select outcomes, and automatically calculate/distribute payouts
- **View All Bets**: Monitor all bets across the platform with admin controls

### Technical Features

- **Real-time Updates**: Axios-based API client with automatic data fetching
- **State Management**: React Context for authentication and user state
- **Type Safety**: Full TypeScript coverage across the application
- **Modern UI**: ShadCN UI components with custom orange (#ED7D3A) and green (#4D9078) theming
- **Secure Headers**: XSS protection, frame options, and content-type security

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Icons**: Lucide React

## Directory Structure

```
kalshi_lite_frontend/
├── app/
│   ├── api/              # API layer (Axios-based)
│   │   ├── base.ts       # Base URL config, auth headers, axios instance
│   │   ├── users.ts      # User registration, login, fetch all users
│   │   ├── bets.ts       # Create, update, delete, end bets (admin)
│   │   ├── userPlacedBets.ts  # Place & remove bets (users)
│   │   └── settings.ts   # Global lock/unlock betting
│   ├── dashboard/
│   │   └── page.tsx      # Main app - tabs for Bets/Leaderboard/Admin
│   ├── page.tsx          # Login page
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── globals.css       # Global styles + Tailwind imports
├── components/
│   ├── ui/               # ShadCN components (Button, Dialog, Card, etc.)
│   ├── BetCard.tsx       # Individual bet display card
│   ├── PlaceBetDialog.tsx  # Modal for placing bets
│   ├── BetsTab.tsx       # User view - browse & place bets
│   ├── LeaderboardTab.tsx  # Rankings of all users
│   ├── CreateBetsTab.tsx   # Admin - create new bets
│   └── ViewBetsTab.tsx     # Admin - view/manage all bets
├── lib/
│   ├── auth-context.tsx  # Authentication state (localStorage-based)
│   ├── types.ts          # TypeScript interfaces (User, Bet, etc.)
│   └── utils.ts          # Utility functions (cn for class merging)
└── .env.example          # Template for environment variables
```

### How It Works

1. **Authentication**: Users log in with a 3-character password (stored in localStorage for demo simplicity)
2. **Betting Flow**:
   - Admin creates a bet (e.g., "Will it rain tomorrow? Yes: 30%, No: 70%")
   - Users browse bets and place wagers using their available balance
   - Money is locked in once bet is placed
   - Admin ends the bet and selects the outcome
   - Payouts are automatically calculated and distributed to winners
3. **Payout Math**: Winners get `bet_amount × (1 / odds_percentage)` - losers get nothing

## How to Run

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_BASE_URL to your backend URL

# Start development server
npm run dev

# App runs at http://localhost:3000
```

### Additional Commands

```bash
npm run build      # Build for production
npm run start      # Start production server
npm run typecheck  # Run TypeScript checks
npm run lint       # Run ESLint
```

### Environment Variables

| Variable                   | Description          | Example                                                                     |
| -------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API endpoint | `http://localhost:3001/api` (dev)<br/>`https://your-backend.com/api` (prod) |

## Additional Info

### Authentication & Security

**Note**: This app uses simple password-based authentication stored in localStorage. This is intentional for a party/demo setting where ease-of-use trumps security. **Not recommended for production use** with real money.

For production, consider:

- JWT tokens with expiration
- Secure HTTP-only cookies
- Password hashing on backend
- Rate limiting
- CORS restrictions

### Kalshi Inspiration

This project is inspired by [Kalshi](https://kalshi.com/), a regulated prediction market exchange. Kalshi Lite is a simplified, unofficial version built for personal use among friends. It is **not affiliated with or endorsed by** Kalshi.

### Betting Rules

- Users cannot bet on outcomes they're involved in (conflict of interest)
- Minimum bet: $1
- Users can only bet with available funds (not invested money)
- Bets can be removed before global lock
- Admin can lock betting to prevent changes before resolution

### Deployment

The app is configured for Vercel deployment (see `vercel.json`). Backend must be deployed separately and accessible via HTTPS in production.

## Future Improvements

Based on user feedback from the birthday party:

### Bet Discovery & Filtering

- **Admin View Bets**:

  - Add filter by people involved in the bet
  - Replace "Active/All Bets" toggle with "Active/Resolved" filter for better clarity

- **User View Bets**:
  - Add filter to show bets by involvement status ("Bets I can join" vs "Bets I've already placed")
  - Show which bets you've already bet on more prominently

### Real-time Updates

- **Available Money**: Update user's available balance immediately after placing/removing a bet (currently requires page refresh)
- **Leaderboard Auto-refresh**: Automatically refresh leaderboard every minute instead of manual refresh button

### Leaderboard Improvements

- Change "Available Money" label to "Liquidated Money" for clarity

### Resolved Bets Enhancement

- **Detailed Breakdown**: Add dropdown to show who bet on which side and how much per person
- **Outcome Highlighting**: Highlight the winning outcome in a different color on resolved bets
- **Notifications**: Send notification when bet ends: "Bet_NAME ended. Outcome: YES. Winners: [list]"

### Bet Management

- **Void Bets**: Add ability to void a bet and automatically refund all participants

### Technical Improvements

- WebSocket support for real-time updates across all clients
- Push notifications for bet endings and payouts
- Historical stats: win/loss ratio, total profit/loss, betting patterns
- Export betting history to CSV

## Contributing

This is a personal project, but feel free to fork and adapt for your own use!

## License

MIT - built with ❤️ for friends who love betting

---

**Questions or issues?** Open an issue or contact me directly.
