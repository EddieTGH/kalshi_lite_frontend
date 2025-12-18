import axios from "axios";
import {
  Party,
  PartyWithMembership,
  PartyMember,
  CreatePartyRequest,
  UpdatePartyRequest,
  JoinPartyRequest,
  AddMemberRequest,
  UpdateMemberRequest,
  GetPartiesResponse,
  JoinPartyResponse,
  GetPartyMembersResponse,
  DeletePartyResponse,
  DeleteMemberResponse,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

// Create a new party
export const createParty = async (
  data: CreatePartyRequest,
  password: string
): Promise<Party> => {
  const response = await axios.post<Party>(`${BASE_URL}/parties`, data, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};

// Get all parties the user is a member of
export const getUserParties = async (
  password: string
): Promise<PartyWithMembership[]> => {
  const response = await axios.get<GetPartiesResponse>(`${BASE_URL}/parties`, {
    headers: createAuthHeaders(password),
  });
  return response.data.parties;
};

// Join a party with a join code
export const joinParty = async (
  data: JoinPartyRequest,
  password: string
): Promise<JoinPartyResponse> => {
  const response = await axios.post<JoinPartyResponse>(
    `${BASE_URL}/parties/join`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Get details for a specific party
export const getPartyById = async (
  partyId: number,
  password: string
): Promise<Party> => {
  const response = await axios.get<Party>(`${BASE_URL}/parties/${partyId}`, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};

// Get all members of a party (leaderboard)
export const getPartyMembers = async (
  partyId: number,
  password: string
): Promise<PartyMember[]> => {
  const response = await axios.get<GetPartyMembersResponse>(
    `${BASE_URL}/parties/${partyId}/members`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data.members;
};

// Update party details (admin only)
export const updateParty = async (
  partyId: number,
  data: UpdatePartyRequest,
  password: string
): Promise<Party> => {
  const response = await axios.put<Party>(
    `${BASE_URL}/parties/${partyId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Delete a party (admin only)
export const deleteParty = async (
  partyId: number,
  password: string
): Promise<DeletePartyResponse> => {
  const response = await axios.delete<DeletePartyResponse>(
    `${BASE_URL}/parties/${partyId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Add a member to the party (admin only)
export const addPartyMember = async (
  partyId: number,
  data: AddMemberRequest,
  password: string
): Promise<PartyMember> => {
  const response = await axios.post<PartyMember>(
    `${BASE_URL}/parties/${partyId}/members`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Update a member's admin status or money (admin only)
export const updatePartyMember = async (
  partyId: number,
  userId: number,
  data: UpdateMemberRequest,
  password: string
): Promise<PartyMember> => {
  const response = await axios.put<PartyMember>(
    `${BASE_URL}/parties/${partyId}/members/${userId}`,
    data,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};

// Remove a member from the party (admin only)
export const removePartyMember = async (
  partyId: number,
  userId: number,
  password: string
): Promise<DeleteMemberResponse> => {
  const response = await axios.delete<DeleteMemberResponse>(
    `${BASE_URL}/parties/${partyId}/members/${userId}`,
    {
      headers: createAuthHeaders(password),
    }
  );
  return response.data;
};
