// User types
export interface User {
  user_id: number;
  name: string;
  password?: string; // Only included on registration
  admin: boolean;
  money: number; // Available balance
  total_money?: number; // Available + invested (for leaderboard)
  created_at?: Date;
}

// Bet types
export interface Bet {
  bet_id: number;
  name: string;
  description: string;
  odds_for_yes: number; // 0-100
  odds_for_no: number; // Calculated: 100 - odds_for_yes
  people_involved: number[]; // Array of user_ids
  in_progress: boolean;
  outcome: "yes" | "no" | null;
  created_at?: Date;
  updated_at?: Date;
}

// User Placed Bet types
export interface UserPlacedBet {
  placed_bet_id: number;
  user_id: number;
  bet_id: number;
  amount: number;
  decision: "yes" | "no";
  resolved: boolean;
  created_at?: Date;
}

// Settings types
export interface Settings {
  id: number; // Always 1 (single row)
  bets_locked: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// API Response types
export interface UserPlacement {
  has_placed: boolean;
  placed_bet_id?: number;
  amount?: number;
  decision?: "yes" | "no";
  potential_payout?: number;
  potential_profit?: number;
  actual_payout?: number;
  actual_profit?: number;
  resolved?: boolean;
}

export interface BetWithPlacement extends Bet {
  user_placement: UserPlacement;
}

export interface Payout {
  user_id: number;
  user_name: string;
  amount_bet: number;
  decision: "yes" | "no";
  payout: number;
  profit: number;
}

// API Request types
export interface LoginRequest {
  password: string;
}

export interface RegisterRequest {
  name: string;
  admin?: boolean;
}

export interface CreateBetRequest {
  name: string;
  description?: string;
  odds_for_yes: number;
  people_involved?: number[];
}

export interface UpdateBetRequest {
  name?: string;
  description?: string;
  odds_for_yes?: number;
  people_involved?: number[];
}

export interface PlaceBetRequest {
  user_id: number;
  bet_id: number;
  amount: number;
  decision: "yes" | "no";
}

export interface EndBetRequest {
  outcome: "yes" | "no";
}

export interface LockBetsRequest {
  bets_locked: boolean;
}

// API Response types
export interface LoginResponse extends User {}

export interface RegisterResponse extends User {
  password: string;
}

export interface GetUsersResponse {
  users: User[];
}

export interface GetBetsForUserResponse {
  bets: BetWithPlacement[];
}

export interface PlaceBetResponse extends UserPlacedBet {
  potential_payout: number;
  potential_profit: number;
  user_money_remaining: number;
}

export interface DeletePlacedBetResponse {
  message: string;
  placed_bet_id: number;
  refunded_amount: number;
  user_money_remaining: number;
}

export interface EndBetResponse extends Bet {
  payouts: Payout[];
}

export interface LockStatusResponse {
  bets_locked: boolean;
}

export interface LockBetsResponse {
  bets_locked: boolean;
  message: string;
}

export interface DeleteBetResponse {
  message: string;
  bet_id: number;
}

// Error response
export interface ApiError {
  status: "error";
  statusCode: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  timestamp: string;
  path: string;
}
