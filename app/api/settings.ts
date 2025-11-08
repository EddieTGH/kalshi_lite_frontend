import axios from "axios";
import {
  LockStatusResponse,
  LockBetsRequest,
  LockBetsResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

export const getLockStatus = async (
  password: string
): Promise<LockStatusResponse> => {
  const response = await axios.get<LockStatusResponse>(
    `${BASE_URL}/settings/lock_status`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

export const updateLockStatus = async (
  data: LockBetsRequest,
  password: string
): Promise<LockBetsResponse> => {
  const response = await axios.put<LockBetsResponse>(
    `${BASE_URL}/settings/lock_bets`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
