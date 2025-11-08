import axios from "axios";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GetUsersResponse,
  User,
} from "@/lib/types";
import { BASE_URL, createAuthHeaders } from "./base";

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${BASE_URL}/users/login`,
    data
  );
  return response.data;
};

export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const response = await axios.post<RegisterResponse>(
    `${BASE_URL}/users/register`,
    data
  );
  return response.data;
};

export const getAllUsers = async (password: string): Promise<User[]> => {
  const response = await axios.get<GetUsersResponse>(`${BASE_URL}/users`, {
    headers: createAuthHeaders(password),
  });
  return response.data.users;
};

export const getUserById = async (
  id: number,
  password: string
): Promise<User> => {
  const response = await axios.get<User>(`${BASE_URL}/users/${id}`, {
    headers: createAuthHeaders(password),
  });
  return response.data;
};
