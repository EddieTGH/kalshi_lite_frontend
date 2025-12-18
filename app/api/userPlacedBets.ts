import axios from "axios";
import {
  PlaceBetRequest,
  PlaceBetResponse,
  DeletePlacedBetResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

// Place a bet on a specific outcome in a party
// Requires party_id query parameter
export const placeBet = async (
  data: PlaceBetRequest,
  partyId: number,
  password: string
): Promise<PlaceBetResponse> => {
  const response = await axios.post<PlaceBetResponse>(
    `${BASE_URL}/user_placed_bets?party_id=${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Delete a placed bet and refund the amount
// Requires party_id query parameter
export const deletePlacedBet = async (
  id: number,
  partyId: number,
  password: string
): Promise<DeletePlacedBetResponse> => {
  const response = await axios.delete<DeletePlacedBetResponse>(
    `${BASE_URL}/user_placed_bets/${id}?party_id=${partyId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
