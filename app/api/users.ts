import axios from "axios";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

// Login user with password
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${BASE_URL}/users/login`,
    data
  );
  return response.data;
};

// Register a new user
export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(
    `${BASE_URL}/users/register`,
    data
  );
  return response.data;
};

// Get user by ID (returns global user data only, not party-specific)
// For party-specific data (money, admin status), use getPartyMembers from parties.ts
export const getUserById = async (
  id: number,
  password: string
): Promise<User> => {
  const response = await axios.get<User>(`${BASE_URL}/users/${id}`, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};
