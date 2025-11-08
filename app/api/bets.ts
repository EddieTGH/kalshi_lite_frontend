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

export const createBet = async (
  data: CreateBetRequest,
  password: string
): Promise<Bet> => {
  const response = await axios.post<Bet>(`${BASE_URL}/bets`, data, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};

export const updateBet = async (
  id: number,
  data: UpdateBetRequest,
  password: string
): Promise<Bet> => {
  const response = await axios.put<Bet>(`${BASE_URL}/bets/${id}`, data, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};

export const deleteBet = async (
  id: number,
  password: string
): Promise<DeleteBetResponse> => {
  const response = await axios.delete<DeleteBetResponse>(
    `${BASE_URL}/bets/${id}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

export const getBetsForUser = async (
  userId: number,
  password: string
): Promise<BetWithPlacement[]> => {
  const response = await axios.get<GetBetsForUserResponse>(
    `${BASE_URL}/bets/user/${userId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data.bets;
};

export const endBet = async (
  id: number,
  data: EndBetRequest,
  password: string
): Promise<EndBetResponse> => {
  const response = await axios.put<EndBetResponse>(
    `${BASE_URL}/bets/${id}/end`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
