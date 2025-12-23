"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement, PartyMember, EndBetResponse } from "@/lib/types";
import { endBet } from "@/app/api/bets";
import { updateLockStatus } from "@/app/api/settings";
import { useBetsCache } from "@/lib/bets-cache-context";
import { BetCard } from "./BetCard";
import { BetFilters, BetFilterState } from "./BetFilters";
import { BetEndedDialog } from "./BetEndedDialog";
import { LoadingOverlay } from "./LoadingOverlay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ViewBetsTabProps {
  userId: number;
  partyId: number; // Party ID is now required
  password: string;
}

export function ViewBetsTab({ userId, partyId, password }: ViewBetsTabProps) {
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

  // Local state for UI interactions
  const [lockLoading, setLockLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [endBetDialogOpen, setEndBetDialogOpen] = useState(false);
  const [selectedBetId, setSelectedBetId] = useState<number | null>(null);
  const [endBetOutcome, setEndBetOutcome] = useState<"yes" | "no">("yes");
  const [endingBet, setEndingBet] = useState(false);
  const [betEndedDialogOpen, setBetEndedDialogOpen] = useState(false);
  const [betEndedResult, setBetEndedResult] = useState<EndBetResponse | null>(null);

  // Filter state
  const [filters, setFilters] = useState<BetFilterState>({
    peopleInvolved: [],
    resolveStatus: "all",
    approvalStatus: "approved",
  });

  /**
   * SILENT REFRESH
   * Called after user actions (place bet, end bet, etc.)
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

  // Handle lock/unlock betting for this party
  const handleLockToggle = async (checked: boolean) => {
    setLockLoading(true);
    try {
      await updateLockStatus({ bets_locked: checked }, partyId, password);
      // Refresh cache to update lock status
      await refreshBets();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update lock status");
    } finally {
      setLockLoading(false);
    }
  };

  const handleEndBetClick = (betId: number) => {
    setSelectedBetId(betId);
    setEndBetDialogOpen(true);
    setEndBetOutcome("yes");
  };

  // Handle end bet with party_id
  const handleEndBetConfirm = async () => {
    if (!selectedBetId) return;

    setEndingBet(true);
    try {
      const result = await endBet(
        selectedBetId,
        { outcome: endBetOutcome },
        partyId,
        password
      );
      setEndBetDialogOpen(false);
      setSelectedBetId(null);
      await refreshBets();

      // Show detailed results dialog
      setBetEndedResult(result);
      setBetEndedDialogOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to end bet");
    } finally {
      setEndingBet(false);
    }
  };

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

  // Show loading only on initial load (when cache is empty)
  if (loading && bets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">Loading bets...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-bold">View Bets (Admin)</h2>
            <Badge variant="outline" className="text-sm font-semibold">
              Available: ${availableMoney.toFixed(2)}
            </Badge>
          </div>

          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="lock-bets" className="text-base font-semibold">
                Lock Betting
              </Label>
              <p className="text-xs text-muted-foreground">
                When locked, users cannot place or remove bets
              </p>
            </div>
            <Switch
              id="lock-bets"
              checked={betsLocked}
              onCheckedChange={handleLockToggle}
              disabled={lockLoading}
            />
          </Card>

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
                showEndButton={true}
                onEndBet={handleEndBetClick}
                availableMoney={availableMoney}
                onMoneyChange={async () => {
                  // Money change is handled by cache refresh
                  await refreshBets();
                }}
                isAdmin={true}
                partyMembers={partyMembers}
                onBetUpdated={refreshBets}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={endBetDialogOpen} onOpenChange={setEndBetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Bet</DialogTitle>
            <DialogDescription>
              Select the final outcome for this bet. All payouts will be processed automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="mb-3 block">What was the outcome?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={endBetOutcome === "yes" ? "default" : "outline"}
                className={endBetOutcome === "yes" ? "bg-primary" : ""}
                onClick={() => setEndBetOutcome("yes")}
              >
                YES
              </Button>
              <Button
                type="button"
                variant={endBetOutcome === "no" ? "default" : "outline"}
                className={endBetOutcome === "no" ? "bg-secondary" : ""}
                onClick={() => setEndBetOutcome("no")}
              >
                NO
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEndBetDialogOpen(false)}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleEndBetConfirm}
              disabled={endingBet}
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
            >
              {endingBet ? "Ending..." : "Confirm & End Bet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BetEndedDialog
        open={betEndedDialogOpen}
        onOpenChange={setBetEndedDialogOpen}
        betResult={betEndedResult}
      />

      <LoadingOverlay
        isVisible={lockLoading}
        message="Updating betting status..."
      />
    </>
  );
}
