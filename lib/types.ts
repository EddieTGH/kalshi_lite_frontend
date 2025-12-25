// User types (v2.0 - admin and money are now party-specific)
export interface User {
  user_id: number;
  name: string;
  password?: string; // Only included on registration
  membership_tier: "basic" | "vip";
  remaining_hosts: number; // How many parties user can create
  created_at?: Date;
}

// Party types (v2.0)
export interface Party {
  party_id: number;
  name: string;
  description?: string;
  date: string | Date; // Party date
  join_code: string; // 3 uppercase letters (A-Z)
  locked_status: boolean; // Party-specific lock status
  starting_balance: number; // Default balance for new members
  created_at?: string | Date;
}

// Party with membership info (returned from GET /parties)
export interface PartyWithMembership extends Party {
  is_admin: boolean; // Whether current user is admin of this party
  member_count: number; // Total members in party
}

// Bet History types (for leaderboard)
export interface BetHistory {
  bet_id: number;
  bet_name: string;
  bet_description: string;
  odds_for_yes: number;
  odds_for_no: number;
  outcome: "yes" | "no" | "void";
  amount_bet: number;
  decision: "yes" | "no";
  payout: number;
  profit: number;
  placed_at: string | Date;
  resolved_at: string | Date;
}

// Party Member types (v2.0)
export interface PartyMember {
  user_id: number;
  name: string;
  admin: boolean; // Party-specific admin status
  money: number; // Party-specific available balance
  total_money: number; // money + money invested in active bets for this party
  joined_at?: string | Date;
  bet_history?: BetHistory[]; // Resolved bets for this member
}

// Bet types (v2.0 - now includes party_id)
export interface Bet {
  bet_id: number;
  party_id: number; // Party this bet belongs to
  name: string;
  description: string;
  odds_for_yes: number; // 0-100
  odds_for_no: number; // Calculated: 100 - odds_for_yes
  people_involved: number[]; // Array of user_ids
  in_progress: boolean;
  outcome: "yes" | "no" | "void" | null;
  status: "pending" | "approved"; // Bet approval status
  created_by?: number; // User ID who created the bet
  approved_by?: number; // User ID who approved the bet (for admins)
  approved_at?: Date; // When the bet was approved
  created_at?: Date;
  ended_at?: Date;
  payouts?: Payout[]; // Detailed payout information when bet is resolved
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
  // Note: admin removed in v2.0 - admin is now party-specific
}

// Party request types (v2.0)
export interface CreatePartyRequest {
  name: string;
  description?: string;
  date: string; // ISO date format (YYYY-MM-DD)
  starting_balance?: number; // Default 100
}

export interface UpdatePartyRequest {
  name?: string;
  description?: string;
  date?: string;
  starting_balance?: number;
}

export interface JoinPartyRequest {
  join_code: string; // Exactly 3 uppercase letters
}

export interface AddMemberRequest {
  user_id: number;
  admin?: boolean;
  money?: number;
}

export interface UpdateMemberRequest {
  admin?: boolean;
  money?: number;
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
  outcome: "yes" | "no" | "void";
}

export interface ApproveBetRequest {
  name?: string;
  description?: string;
  odds_for_yes?: number;
  people_involved?: number[];
}

export interface LockBetsRequest {
  bets_locked: boolean;
}

// API Response types
export type LoginResponse = User;

export interface RegisterResponse extends User {
  password: string;
}

// Party response types (v2.0)
export interface GetPartiesResponse {
  parties: PartyWithMembership[];
}

export interface JoinPartyResponse extends Party {
  user_money: number;
  message: string;
}

export interface GetPartyMembersResponse {
  members: PartyMember[];
}

export interface DeletePartyResponse {
  message: string;
  party_id: number;
  host_refunded: boolean;
}

export interface DeleteMemberResponse {
  message: string;
  user_id: number;
  party_id: number;
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
