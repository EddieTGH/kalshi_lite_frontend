"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { BetWithPlacement, PartyMember } from "./types";
import { getBetsForUser } from "@/app/api/bets";
import { getPartyMembers } from "@/app/api/parties";
import { getLockStatus } from "@/app/api/settings";

/**
 * BETS CACHE CONTEXT
 *
 * This context provides a centralized cache for bet data across the application.
 * It implements the following caching strategy:
 *
 * 1. INSTANT DISPLAY: Components show cached data immediately on mount (no loading spinner when switching tabs)
 * 2. BACKGROUND REFRESH: All data refreshes silently every 30 seconds, regardless of active tab
 * 3. SILENT INVALIDATION: User actions (place bet, approve bet, etc.) trigger silent background refreshes
 * 4. SINGLE SOURCE OF TRUTH: One cache holds all data, components filter as needed
 *
 * ARCHITECTURE:
 * - Cache stores RAW data (all bets, all party members, etc.)
 * - Components filter the data for their specific needs
 * - Example: YourBetsTab filters bets where user has placed, BrowseBetsTab filters where user hasn't placed
 *
 * See /docs/caching-strategy.md for detailed documentation.
 */

// Single cache data structure for all tabs
interface BetsCache {
  bets: BetWithPlacement[]; // All bets in the party
  partyMembers: PartyMember[]; // All members in the party
  availableMoney: number; // Current user's available money
  betsLocked: boolean; // Whether betting is locked for this party
  lastFetched: number | null; // Timestamp of last fetch
}

interface BetsCacheContextType {
  // Single cache for all tabs
  cache: BetsCache;
  loading: boolean;

  // Actions to invalidate cache (triggers silent refresh)
  invalidateCache: () => Promise<void>;

  // Initial fetch function (shows loading spinner)
  fetchCache: () => Promise<void>;

  // Force a full reload (e.g., when switching parties)
  reloadAllData: () => Promise<void>;
}

const BetsCacheContext = createContext<BetsCacheContextType | undefined>(undefined);

// Background refresh interval: 30 seconds
const BACKGROUND_REFRESH_INTERVAL = 30000;

interface BetsCacheProviderProps {
  children: React.ReactNode;
  userId: number;
  partyId: number;
  password: string;
}

export function BetsCacheProvider({ children, userId, partyId, password }: BetsCacheProviderProps) {
  // Store auth context in refs to avoid recreating callback functions
  const userIdRef = useRef<number>(userId);
  const partyIdRef = useRef<number>(partyId);
  const passwordRef = useRef<string>(password);

  // Update refs when props change (e.g., when switching parties)
  useEffect(() => {
    userIdRef.current = userId;
    partyIdRef.current = partyId;
    passwordRef.current = password;
  }, [userId, partyId, password]);

  // Single cache state for all tabs
  const [cache, setCache] = useState<BetsCache>({
    bets: [],
    partyMembers: [],
    availableMoney: 0,
    betsLocked: false,
    lastFetched: null,
  });
  const [loading, setLoading] = useState(false);

  /**
   * FETCH CACHE DATA
   * Shows loading spinner - used for initial load or party changes
   * Fetches all data needed by all tabs in a single set of API calls
   */
  const fetchCache = useCallback(async () => {
    setLoading(true);
    try {
      const [betsData, lockData, membersData] = await Promise.all([
        getBetsForUser(userIdRef.current, partyIdRef.current, passwordRef.current),
        getLockStatus(partyIdRef.current, passwordRef.current),
        getPartyMembers(partyIdRef.current, passwordRef.current),
      ]);

      // Find current user's available money
      const currentUser = membersData.find((m) => m.user_id === userIdRef.current);
      const availableMoney = currentUser?.money || 0;

      setCache({
        bets: betsData,
        partyMembers: membersData,
        availableMoney,
        betsLocked: lockData.bets_locked,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("Failed to fetch cache:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * SILENT REFRESH CACHE
   * No loading spinner - data updates in background
   * This is called after user actions (place bet, end bet, etc.) and by the background refresh interval
   */
  const invalidateCache = useCallback(async () => {
    try {
      const [betsData, lockData, membersData] = await Promise.all([
        getBetsForUser(userIdRef.current, partyIdRef.current, passwordRef.current),
        getLockStatus(partyIdRef.current, passwordRef.current),
        getPartyMembers(partyIdRef.current, passwordRef.current),
      ]);

      // Find current user's available money
      const currentUser = membersData.find((m) => m.user_id === userIdRef.current);
      const availableMoney = currentUser?.money || 0;

      setCache({
        bets: betsData,
        partyMembers: membersData,
        availableMoney,
        betsLocked: lockData.bets_locked,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("Failed to refresh cache:", err);
    }
  }, []);

  /**
   * FORCE RELOAD ALL DATA
   * Shows loading spinner - use when switching parties
   */
  const reloadAllData = useCallback(async () => {
    await fetchCache();
  }, [fetchCache]);

  /**
   * INITIAL DATA LOAD
   * Fetch data on mount and when party changes
   */
  useEffect(() => {
    reloadAllData();
  }, [partyId]); // Re-fetch when party changes

  /**
   * BACKGROUND REFRESH INTERVAL
   * Silently refreshes all data every 30 seconds
   * This keeps all tabs fresh even when inactive
   */
  useEffect(() => {
    // Set up 30-second background refresh
    const intervalId = setInterval(() => {
      console.log("[BetsCache] Running background refresh...");
      invalidateCache();
    }, BACKGROUND_REFRESH_INTERVAL);

    // Cleanup interval on unmount or when party changes
    return () => {
      clearInterval(intervalId);
    };
  }, [invalidateCache]);

  // Create context value
  const contextValue: BetsCacheContextType = {
    cache,
    loading,
    invalidateCache,
    fetchCache,
    reloadAllData,
  };

  return (
    <BetsCacheContext.Provider value={contextValue}>
      {children}
    </BetsCacheContext.Provider>
  );
}

/**
 * HOOK: useBetsCache
 * Use this hook in components to access the bets cache
 *
 * Example:
 * ```tsx
 * const { cache, invalidateCache } = useBetsCache();
 *
 * // Extract and filter data as needed
 * const yourBets = cache.bets.filter(bet => bet.user_placement.has_placed);
 * const browseBets = cache.bets.filter(bet => !bet.user_placement.has_placed);
 *
 * // Show cached data immediately
 * <BetCard bets={yourBets} partyMembers={cache.partyMembers} />
 *
 * // After user places a bet, trigger silent refresh
 * await placeBet(...);
 * await invalidateCache();
 * ```
 */
export function useBetsCache() {
  const context = useContext(BetsCacheContext);
  if (context === undefined) {
    throw new Error("useBetsCache must be used within a BetsCacheProvider");
  }
  return context;
}
