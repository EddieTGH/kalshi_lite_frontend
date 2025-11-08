# Kalshi Lite Frontend

A betting application built with Next.js 16, TypeScript, Tailwind CSS, and ShadCN UI. Users can place bets with friends, track their balances, and compete on a leaderboard.

## Features

### User Features

- **Password-Based Authentication**: Simple 3-character password login
- **Bets Tab**: View, place, and manage bets on various outcomes
- **Leaderboard**: See rankings of all users by total money (available + invested)
- **Mobile-Responsive**: Fully responsive design that works on phones and desktops

### Admin Features

- **Create Bets**: Add new bets with custom odds and involved parties
- **View Bets**: Monitor all bets with admin controls
- **Lock Betting**: Globally lock/unlock betting to prevent changes
- **End Bets**: Finalize bets and automatically process payouts

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Icons**: Lucide React

## Color Palette

- **Primary (Orange)**: `#ED7D3A`
- **Secondary (Green)**: `#4D9078`
- **Beige Background**: `#F5F5DC`

## Prerequisites

- Node.js 18+ (recommended: v20+)
- npm or yarn
- Backend API running (default: `http://localhost:3001/api`)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your backend API URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

### 4. Build for Production

```bash
npm run build
npm run start
```

### 5. Type Checking

```bash
npm run typecheck
```

## Project Structure

```
kalshi_lite_frontend/
├── app/
│   ├── api/                    # API layer (Axios-based)
│   │   ├── base.ts            # Base configuration
│   │   ├── users.ts           # User endpoints
│   │   ├── bets.ts            # Bet endpoints
│   │   ├── userPlacedBets.ts  # User placed bet endpoints
│   │   └── settings.ts        # Settings endpoints
│   ├── dashboard/
│   │   └── page.tsx           # Main dashboard with tabs
│   ├── page.tsx               # Login page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # ShadCN UI components
│   ├── BetCard.tsx            # Bet display card
│   ├── PlaceBetDialog.tsx     # Place bet modal
│   ├── BetsTab.tsx            # Bets tab for users
│   ├── LeaderboardTab.tsx     # Leaderboard tab
│   ├── CreateBetsTab.tsx      # Create bets (admin)
│   └── ViewBetsTab.tsx        # View bets (admin)
├── lib/
│   ├── auth-context.tsx       # Authentication context
│   ├── types.ts               # TypeScript interfaces
│   └── utils.ts               # Utility functions
├── .env.example               # Environment variables template
├── .env.local                 # Local environment variables (git-ignored)
├── vercel.json                # Vercel configuration
└── package.json
```

## Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your repository

3. **Configure Environment Variables**

   In the Vercel dashboard, add the following environment variable:

   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: Your production backend API URL (e.g., `https://your-backend-api.com/api`)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   vercel
   ```

4. **Add Environment Variables**

   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   ```

   Enter your production backend API URL when prompted.

5. **Deploy to Production**

   ```bash
   vercel --prod
   ```

## Environment Variables

| Variable                   | Description          | Required | Example                                                                    |
| -------------------------- | -------------------- | -------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | Yes      | `http://localhost:3001/api` (dev)<br/>`https://api.yourapp.com/api` (prod) |

**Important**: The `NEXT_PUBLIC_` prefix makes the variable accessible in the browser. This is required for client-side API calls.

## Backend Requirements

The frontend expects a backend API with the following endpoints:

### Authentication

- `POST /users/login` - Login user
- `POST /users/register` - Register new user (optional)

### Users

- `GET /users` - Get all users (leaderboard)
- `GET /users/:id` - Get user by ID

### Bets

- `POST /bets` - Create bet (admin)
- `PUT /bets/:id` - Update bet (admin)
- `DELETE /bets/:id` - Delete bet (admin)
- `GET /bets/user/:user_id` - Get bets for user
- `PUT /bets/:id/end` - End bet (admin)

### User Placed Bets

- `POST /user_placed_bets` - Place bet
- `DELETE /user_placed_bets/:id` - Delete placed bet

### Settings

- `GET /settings/lock_status` - Get lock status
- `PUT /settings/lock_bets` - Update lock status (admin)

See `api_contract.md` for full API documentation.

## Features & Business Rules

### Betting Rules

1. Users cannot bet on bets where they are involved in the outcome
2. Minimum bet amount is $1
3. Users can only bet with available funds (not invested money)
4. Bets can be removed before they are locked

### Admin Controls

1. Admins can create, update, and delete bets
2. Admins can lock betting globally (prevents placing/removing bets)
3. Admins can end bets and select the outcome
4. Payouts are automatically calculated and distributed

### Payout Calculation

- **Winners**: `payout = amount_bet × (1 / odds_percentage)`
- **Losers**: `payout = 0` (lose entire bet)
- **Profit**: `payout - amount_bet`

## Mobile Optimization

The app is fully responsive and optimized for mobile devices:

- Dynamic font sizes (text-sm, text-base, text-lg)
- Responsive grids (grid-cols-2, sm:grid-cols-3)
- Flexible layouts (flex-wrap, flex-col on mobile)
- Touch-friendly buttons and inputs
- No fixed pixel widths (uses rem, %, vh/vw)

## Security Considerations

### For Production Deployment

1. **HTTPS Only**: Always use HTTPS in production
2. **Environment Variables**: Never commit `.env.local` or expose API keys
3. **CORS Configuration**: Configure your backend to only accept requests from your Vercel domain
4. **Authentication**: Consider implementing JWT tokens for production instead of simple password auth
5. **Rate Limiting**: Implement rate limiting on the backend API
6. **Input Validation**: All inputs are validated on both frontend and backend

### Security Headers

The `vercel.json` configuration includes security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Troubleshooting

### Build Errors

**Issue**: TypeScript errors during build

```bash
npm run typecheck
```

**Issue**: Missing environment variables

Ensure `.env.local` exists and contains `NEXT_PUBLIC_API_BASE_URL`.

### API Connection Issues

**Issue**: Cannot connect to backend

1. Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Verify backend is running and accessible
3. Check browser console for CORS errors
4. Ensure backend allows requests from your frontend domain

### Vercel Deployment Issues

**Issue**: Build fails on Vercel

1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Verify environment variables are set in Vercel dashboard

**Issue**: API calls fail in production

1. Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
2. Check that backend API is accessible from Vercel's servers
3. Ensure CORS is configured on backend

## Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start development server     |
| `npm run build`     | Build for production         |
| `npm run start`     | Start production server      |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint`      | Run ESLint                   |

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run typecheck` and `npm run build`
4. Test thoroughly on both desktop and mobile
5. Submit a pull request

## License

Private project

## Support

For issues or questions, please contact the development team.

---

**Built with** ❤️ **using Next.js and ShadCN UI**
