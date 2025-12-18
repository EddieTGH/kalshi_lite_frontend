import axios from "axios";
import {
  LockStatusResponse,
  LockBetsRequest,
  LockBetsResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

// Get lock status for a specific party
// Requires party_id query parameter
export const getLockStatus = async (
  partyId: number,
  password: string
): Promise<LockStatusResponse> => {
  const response = await axios.get<LockStatusResponse>(
    `${BASE_URL}/settings/lock_status?party_id=${partyId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Lock or unlock betting for a specific party (party admin only)
// Requires party_id query parameter
export const updateLockStatus = async (
  data: LockBetsRequest,
  partyId: number,
  password: string
): Promise<LockBetsResponse> => {
  const response = await axios.put<LockBetsResponse>(
    `${BASE_URL}/settings/lock_bets?party_id=${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
