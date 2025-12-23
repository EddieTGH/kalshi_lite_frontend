"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement, PartyMember } from "@/lib/types";
import { useBetsCache } from "@/lib/bets-cache-context";
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
  /**
   * USE BETS CACHE
   * Read from shared cache - this provides instant display when switching tabs
   * The cache is automatically refreshed every 30 seconds in the background
   */
  const { cache, loading, invalidateCache } = useBetsCache();

  // Extract data from cache (all tabs share the same cache)
  const bets = cache.bets;
  const partyMembers = cache.partyMembers;
  const availableMoney = cache.availableMoney;
  const betsLocked = cache.betsLocked;

  // Filter state
  const [filters, setFilters] = useState<BetFilterState>({
    peopleInvolved: [],
    resolveStatus: "all",
    approvalStatus: "approved",
  });

  /**
   * SILENT REFRESH
   * Called after user actions (place bet, etc.)
   * Updates cache in background without showing loading spinner
   */
  const refreshBets = async () => {
    await invalidateCache();
  };

  // Initialize filters with all people selected once party members load
  useEffect(() => {
    if (partyMembers.length > 0 && filters.peopleInvolved.length === 0) {
      setFilters((prev) => ({
        ...prev,
        peopleInvolved: partyMembers.map((m) => m.user_id),
      }));
    }
  }, [partyMembers]);

  // Apply filters to bets
  const applyFilters = (betsToFilter: BetWithPlacement[]) => {
    let filtered = betsToFilter;

    // Filter out bets user has already invested in (shown in "Your Bets")
    filtered = filtered.filter((bet) => !bet.user_placement.has_placed);

    // Filter by people involved
    // If all people selected (or equal to party member count), don't filter
    if (
      filters.peopleInvolved.length > 0 &&
      filters.peopleInvolved.length < partyMembers.length
    ) {
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

  // Show loading only on initial load (when cache is empty)
  if (loading && bets.length === 0) {
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

        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-gray-500 border-border">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>Note:</strong> Please do not mention bets that involve other
            people to those specific people as to not ruin the authenticity of
            the outcomes.
          </p>
        </div>

        {/* Bet Filters */}
        <BetFilters
          partyMembers={partyMembers}
          onApplyFilters={setFilters}
          initialFilters={filters}
        />
      </div>

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
              onMoneyChange={async () => {
                // Money change is handled by cache refresh
                await refreshBets();
              }}
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
