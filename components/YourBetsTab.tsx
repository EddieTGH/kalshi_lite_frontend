"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BetWithPlacement, PartyMember } from "@/lib/types";
import { useBetsCache } from "@/lib/bets-cache-context";
import { BetCard } from "./BetCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface YourBetsTabProps {
  userId: number;
  partyId: number;
  password: string;
  isAdmin: boolean;
  onNavigateToBrowse: () => void; // Callback to navigate to Browse Bets tab
  onNavigateToCreate: () => void; // Callback to navigate to Create Bet page
}

export function YourBetsTab({
  userId,
  partyId,
  password,
  isAdmin,
  onNavigateToBrowse,
  onNavigateToCreate,
}: YourBetsTabProps) {
  const router = useRouter();

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

  // Local state for UI interactions only
  const [resolvedExpanded, setResolvedExpanded] = useState(true);
  const [unresolvedExpanded, setUnresolvedExpanded] = useState(true);
  const [pendingExpanded, setPendingExpanded] = useState(true);

  /**
   * SILENT REFRESH
   * Called after user actions (place bet, remove bet, etc.)
   * Updates cache in background without showing loading spinner
   */
  const refreshBets = async () => {
    await invalidateCache();
  };

  // Filter to show only bets the user has invested in
  const yourBets = bets.filter((bet) => bet.user_placement.has_placed);

  // Filter to show pending bets created by the user
  const yourPendingBets = bets.filter(
    (bet) => bet.status === "pending" && bet.created_by === userId
  );

  // Separate resolved and unresolved bets (only approved bets)
  const resolvedBets = yourBets
    .filter((bet) => !bet.in_progress && bet.status === "approved")
    .sort((a, b) => {
      // Sort by ended_at, most recent first
      if (!a.ended_at || !b.ended_at) return 0;
      return new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime();
    });

  const unresolvedBets = yourBets.filter(
    (bet) => bet.in_progress && bet.status === "approved"
  );

  // Show loading only on initial load (when cache is empty)
  if (loading && bets.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Loading your bets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Available Money Display */}
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Available Money</p>
        <p className="text-2xl font-bold">
          ${availableMoney.toFixed(2)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onNavigateToCreate}
          size="lg"
          className="w-full h-12 text-base"
        >
          {isAdmin ? "Create Bet" : "Suggest Bet"}
        </Button>
        <Button
          onClick={onNavigateToBrowse}
          variant="outline"
          size="lg"
          className="w-full h-12 text-base"
        >
          Browse Bets
        </Button>
      </div>

      {/* Empty State */}
      {yourBets.length === 0 && yourPendingBets.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-muted-foreground mb-4">
            You haven't invested in any bets yet
          </p>
          <Button onClick={onNavigateToBrowse} variant="outline">
            Browse Available Bets
          </Button>
        </div>
      )}

      {/* Your Created Pending Bets Section */}
      {yourPendingBets.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => setPendingExpanded(!pendingExpanded)}
            className="w-full justify-between p-4 h-auto hover:bg-gray-50"
          >
            <span className="font-semibold text-base">
              Your Created Pending Bets ({yourPendingBets.length})
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                pendingExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>

          {pendingExpanded && (
            <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
              {yourPendingBets.map((bet) => (
                <BetCard
                  key={bet.bet_id}
                  bet={bet}
                  userId={userId}
                  partyId={partyId}
                  password={password}
                  partyMembers={partyMembers}
                  onBetUpdated={refreshBets}
                  availableMoney={availableMoney}
                  onMoneyChange={() => {
                    // Money change is handled by cache refresh
                    refreshBets();
                  }}
                  isAdmin={isAdmin}
                  betsLocked={false}
                  onBetPlaced={refreshBets}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resolved Bets Section */}
      {resolvedBets.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => setResolvedExpanded(!resolvedExpanded)}
            className="w-full justify-between p-4 h-auto hover:bg-gray-50"
          >
            <span className="font-semibold text-base">
              Resolved Bets ({resolvedBets.length})
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                resolvedExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>

          {resolvedExpanded && (
            <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
              {resolvedBets.map((bet) => (
                <BetCard
                  key={bet.bet_id}
                  bet={bet}
                  userId={userId}
                  partyId={partyId}
                  password={password}
                  partyMembers={partyMembers}
                  onBetUpdated={refreshBets}
                  availableMoney={availableMoney}
                  onMoneyChange={() => {
                    // Money change is handled by cache refresh
                    refreshBets();
                  }}
                  isAdmin={isAdmin}
                  betsLocked={false}
                  onBetPlaced={refreshBets}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unresolved Bets Section */}
      {unresolvedBets.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Button
            variant="ghost"
            onClick={() => setUnresolvedExpanded(!unresolvedExpanded)}
            className="w-full justify-between p-4 h-auto hover:bg-gray-50"
          >
            <span className="font-semibold text-base">
              Unresolved Bets ({unresolvedBets.length})
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                unresolvedExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>

          {unresolvedExpanded && (
            <div className="p-4 pt-0 space-y-3 max-h-96 overflow-y-auto">
              {unresolvedBets.map((bet) => (
                <BetCard
                  key={bet.bet_id}
                  bet={bet}
                  userId={userId}
                  partyId={partyId}
                  password={password}
                  partyMembers={partyMembers}
                  onBetUpdated={refreshBets}
                  availableMoney={availableMoney}
                  onMoneyChange={() => {
                    // Money change is handled by cache refresh
                    refreshBets();
                  }}
                  isAdmin={isAdmin}
                  betsLocked={false}
                  onBetPlaced={refreshBets}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
