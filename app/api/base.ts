import axios from "axios";

// Use environment variable for API base URL, fallback to localhost for development
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

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
