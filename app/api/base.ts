import axios from "axios";

export const BASE_URL = "http://localhost:3001/api";

export const createAuthHeaders = (password: string) => ({
  password,
  "Content-Type": "application/json",
});

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
