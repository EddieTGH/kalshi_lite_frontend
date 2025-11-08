import axios from "axios";
import {
  PlaceBetRequest,
  PlaceBetResponse,
  DeletePlacedBetResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

export const placeBet = async (
  data: PlaceBetRequest,
  password: string
): Promise<PlaceBetResponse> => {
  const response = await axios.post<PlaceBetResponse>(
    `${BASE_URL}/user_placed_bets`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

export const deletePlacedBet = async (
  id: number,
  password: string
): Promise<DeletePlacedBetResponse> => {
  const response = await axios.delete<DeletePlacedBetResponse>(
    `${BASE_URL}/user_placed_bets/${id}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
