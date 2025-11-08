"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  password: string | null;
  login: (user: User, password: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedPassword = localStorage.getItem("password");

    if (storedUser && storedPassword) {
      setUser(JSON.parse(storedUser));
      setPassword(storedPassword);
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, newPassword: string) => {
    setUser(newUser);
    setPassword(newPassword);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("password", newPassword);
  };

  const logout = () => {
    setUser(null);
    setPassword(null);
    localStorage.removeItem("user");
    localStorage.removeItem("password");
  };

  return (
    <AuthContext.Provider value={{ user, password, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
