import axios from "axios";
import {
  Bet,
  CreateBetRequest,
  UpdateBetRequest,
  EndBetRequest,
  EndBetResponse,
  GetBetsForUserResponse,
  BetWithPlacement,
  DeleteBetResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

// Create a new bet (party admin only)
// Requires party_id query parameter
export const createBet = async (
  data: CreateBetRequest,
  partyId: number,
  password: string
): Promise<Bet> => {
  const response = await axios.post<Bet>(
    `${BASE_URL}/bets?party_id=${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Update bet metadata (party admin only)
// Requires party_id query parameter
export const updateBet = async (
  id: number,
  data: UpdateBetRequest,
  partyId: number,
  password: string
): Promise<Bet> => {
  const response = await axios.put<Bet>(
    `${BASE_URL}/bets/${id}?party_id=${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Delete a bet (party admin only)
// Requires party_id query parameter
export const deleteBet = async (
  id: number,
  partyId: number,
  password: string
): Promise<DeleteBetResponse> => {
  const response = await axios.delete<DeleteBetResponse>(
    `${BASE_URL}/bets/${id}?party_id=${partyId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Get all bets for a user in a specific party
// Requires party_id query parameter
export const getBetsForUser = async (
  userId: number,
  partyId: number,
  password: string
): Promise<BetWithPlacement[]> => {
  const response = await axios.get<GetBetsForUserResponse>(
    `${BASE_URL}/bets/user/${userId}?party_id=${partyId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data.bets;
};

// End a bet and process payouts (party admin only)
// Requires party_id query parameter
export const endBet = async (
  id: number,
  data: EndBetRequest,
  partyId: number,
  password: string
): Promise<EndBetResponse> => {
  const response = await axios.put<EndBetResponse>(
    `${BASE_URL}/bets/${id}/end?party_id=${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
