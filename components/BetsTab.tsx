"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement, PartyMember } from "@/lib/types";
import { getBetsForUser } from "@/app/api/bets";
import { getLockStatus } from "@/app/api/settings";
import { getPartyMembers } from "@/app/api/parties";
import { BetCard } from "./BetCard";
import { BetFilters, BetFilterState } from "./BetFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BetsTabProps {
  userId: number;
  partyId: number; // Party ID is now required
  password: string;
}

export function BetsTab({ userId, partyId, password }: BetsTabProps) {
  const [bets, setBets] = useState<BetWithPlacement[]>([]);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [betsLocked, setBetsLocked] = useState(false);
  const [availableMoney, setAvailableMoney] = useState<number>(0);

  // Filter state
  const [filters, setFilters] = useState<BetFilterState>({
    peopleInvolved: [],
    resolveStatus: "all",
    approvalStatus: "approved",
  });

  // Initialize filters with all people selected once party members load
  useEffect(() => {
    if (partyMembers.length > 0 && filters.peopleInvolved.length === 0) {
      setFilters((prev) => ({
        ...prev,
        peopleInvolved: partyMembers.map((m) => m.user_id),
      }));
    }
  }, [partyMembers]);

  // Fetch bets, lock status, and party members for the current party
  const fetchBets = async () => {
    setLoading(true);
    setError("");
    try {
      const [betsData, lockData, membersData] = await Promise.all([
        getBetsForUser(userId, partyId, password),
        getLockStatus(partyId, password),
        getPartyMembers(partyId, password),
      ]);
      setBets(betsData);
      setBetsLocked(lockData.bets_locked);
      setPartyMembers(membersData);

      // Set current user's available money
      const currentUser = membersData.find((m) => m.user_id === userId);
      if (currentUser) {
        setAvailableMoney(currentUser.money);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load bets");
    } finally {
      setLoading(false);
    }
  };

  // Refresh bets without showing loading spinner (silent refresh)
  const refreshBets = async () => {
    try {
      const [betsData, membersData] = await Promise.all([
        getBetsForUser(userId, partyId, password),
        getPartyMembers(partyId, password),
      ]);
      setBets(betsData);
      setPartyMembers(membersData);

      // Set current user's available money
      const currentUser = membersData.find((m) => m.user_id === userId);
      if (currentUser) {
        setAvailableMoney(currentUser.money);
      }
    } catch (err: any) {
      // Silently fail or show a toast notification instead of disrupting the UI
      console.error("Failed to refresh bets:", err);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [userId, partyId, password]); // Re-fetch when party changes

  // Apply filters to bets
  const applyFilters = (betsToFilter: BetWithPlacement[]) => {
    let filtered = betsToFilter;

    // Filter out bets user has already invested in (shown in "Your Bets")
    filtered = filtered.filter((bet) => !bet.user_placement.has_placed);

    // Filter by people involved
    // If all people selected (or equal to party member count), don't filter
    if (filters.peopleInvolved.length > 0 && filters.peopleInvolved.length < partyMembers.length) {
      filtered = filtered.filter((bet) => {
        // Check if any of the selected people are involved in this bet
        return filters.peopleInvolved.some((personId) =>
          bet.people_involved.includes(personId)
        );
      });
    } else if (filters.peopleInvolved.length === 0) {
      // No people selected - show only bets with no people involved
      filtered = filtered.filter((bet) => bet.people_involved.length === 0);
    }

    // Filter by resolve status
    if (filters.resolveStatus === "active") {
      filtered = filtered.filter((bet) => bet.in_progress);
    } else if (filters.resolveStatus === "resolved") {
      filtered = filtered.filter((bet) => !bet.in_progress);
    }

    // Filter by approval status
    if (filters.approvalStatus === "approved") {
      filtered = filtered.filter((bet) => bet.status === "approved");
    } else if (filters.approvalStatus === "pending") {
      filtered = filtered.filter((bet) => bet.status === "pending");
    }

    return filtered;
  };

  const displayBets = applyFilters(bets);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">Loading bets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold">Bets</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-sm font-semibold">
              Available: ${availableMoney.toFixed(2)}
            </Badge>
            {betsLocked && (
              <Badge variant="destructive" className="text-xs">
                Betting Locked
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>Note:</strong> Please do not mention bets that involve other people to those
            specific people as to not ruin the authenticity of the outcomes.
          </p>
        </div>

        {/* Bet Filters */}
        <BetFilters
          partyMembers={partyMembers}
          onApplyFilters={setFilters}
          initialFilters={filters}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {displayBets.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No bets match your current filters
        </Card>
      ) : (
        <div className="space-y-3">
          {displayBets.map((bet) => (
            <BetCard
              key={bet.bet_id}
              bet={bet}
              userId={userId}
              partyId={partyId}
              password={password}
              betsLocked={betsLocked}
              onBetPlaced={refreshBets}
              availableMoney={availableMoney}
              onMoneyChange={setAvailableMoney}
              isAdmin={false}
              partyMembers={partyMembers}
              onBetUpdated={refreshBets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
