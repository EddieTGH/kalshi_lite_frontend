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

  // Filter state
  const [filters, setFilters] = useState<BetFilterState>({
    peopleInvolved: [],
    resolveStatus: "all",
    investedStatus: "all",
  });

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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load bets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [userId, partyId, password]); // Re-fetch when party changes

  // Apply filters to bets
  const applyFilters = (betsToFilter: BetWithPlacement[]) => {
    let filtered = betsToFilter;

    // Filter by people involved
    if (filters.peopleInvolved.length > 0) {
      filtered = filtered.filter((bet) => {
        // Check if any of the selected people are involved in this bet
        return filters.peopleInvolved.some((personId) =>
          bet.people_involved.includes(personId)
        );
      });
    }

    // Filter by resolve status
    if (filters.resolveStatus === "active") {
      filtered = filtered.filter((bet) => bet.in_progress);
    } else if (filters.resolveStatus === "resolved") {
      filtered = filtered.filter((bet) => !bet.in_progress);
    }

    // Filter by invested status
    if (filters.investedStatus === "invested") {
      filtered = filtered.filter((bet) => bet.user_placement.has_placed);
    } else if (filters.investedStatus === "not-invested") {
      filtered = filtered.filter((bet) => !bet.user_placement.has_placed);
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
              onBetPlaced={fetchBets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
