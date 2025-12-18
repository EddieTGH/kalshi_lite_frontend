"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, PartyWithMembership } from "./types";

interface AuthContextType {
  user: User | null;
  password: string | null;
  currentParty: PartyWithMembership | null;
  currentPartyId: number | null;
  login: (user: User, password: string) => void;
  logout: () => void;
  setCurrentParty: (party: PartyWithMembership | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [currentParty, setCurrentPartyState] =
    useState<PartyWithMembership | null>(null);
  const [currentPartyId, setCurrentPartyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and party from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedPassword = localStorage.getItem("password");
    const storedParty = localStorage.getItem("currentParty");
    const storedPartyId = localStorage.getItem("currentPartyId");

    if (storedUser && storedPassword) {
      setUser(JSON.parse(storedUser));
      setPassword(storedPassword);
    }

    if (storedParty && storedPartyId) {
      setCurrentPartyState(JSON.parse(storedParty));
      setCurrentPartyId(Number(storedPartyId));
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
    setCurrentPartyState(null);
    setCurrentPartyId(null);
    localStorage.removeItem("user");
    localStorage.removeItem("password");
    localStorage.removeItem("currentParty");
    localStorage.removeItem("currentPartyId");
  };

  const setCurrentParty = (party: PartyWithMembership | null) => {
    setCurrentPartyState(party);
    if (party) {
      setCurrentPartyId(party.party_id);
      localStorage.setItem("currentParty", JSON.stringify(party));
      localStorage.setItem("currentPartyId", party.party_id.toString());
    } else {
      setCurrentPartyId(null);
      localStorage.removeItem("currentParty");
      localStorage.removeItem("currentPartyId");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        password,
        currentParty,
        currentPartyId,
        login,
        logout,
        setCurrentParty,
        isLoading,
      }}
    >
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
