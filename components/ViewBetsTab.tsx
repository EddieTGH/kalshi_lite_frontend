"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement } from "@/lib/types";
import { getBetsForUser, endBet } from "@/app/api/bets";
import { getLockStatus, updateLockStatus } from "@/app/api/settings";
import { BetCard } from "./BetCard";
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
  password: string;
  userMoney: number;
}

export function ViewBetsTab({ userId, password, userMoney }: ViewBetsTabProps) {
  const [bets, setBets] = useState<BetWithPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [betsLocked, setBetsLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [endBetDialogOpen, setEndBetDialogOpen] = useState(false);
  const [selectedBetId, setSelectedBetId] = useState<number | null>(null);
  const [endBetOutcome, setEndBetOutcome] = useState<"yes" | "no">("yes");
  const [endingBet, setEndingBet] = useState(false);

  const fetchBets = async () => {
    setLoading(true);
    setError("");
    try {
      const [betsData, lockData] = await Promise.all([
        getBetsForUser(userId, password),
        getLockStatus(password),
      ]);
      setBets(betsData);
      setBetsLocked(lockData.bets_locked);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load bets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [userId, password]);

  const handleLockToggle = async (checked: boolean) => {
    setLockLoading(true);
    try {
      await updateLockStatus({ bets_locked: checked }, password);
      setBetsLocked(checked);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update lock status");
      // Revert on error
    } finally {
      setLockLoading(false);
    }
  };

  const handleEndBetClick = (betId: number) => {
    setSelectedBetId(betId);
    setEndBetDialogOpen(true);
    setEndBetOutcome("yes");
  };

  const handleEndBetConfirm = async () => {
    if (!selectedBetId) return;

    setEndingBet(true);
    try {
      const result = await endBet(selectedBetId, { outcome: endBetOutcome }, password);
      setEndBetDialogOpen(false);
      setSelectedBetId(null);
      fetchBets();

      // Show success message with payouts
      const totalWinners = result.payouts.filter((p) => p.profit > 0).length;
      const totalLosers = result.payouts.filter((p) => p.profit <= 0).length;
      alert(
        `Bet ended successfully!\nOutcome: ${result.outcome?.toUpperCase()}\nWinners: ${totalWinners}\nLosers: ${totalLosers}`
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to end bet");
    } finally {
      setEndingBet(false);
    }
  };

  const activeBets = bets.filter((bet) => bet.in_progress);
  const resolvedBets = bets.filter((bet) => !bet.in_progress);
  const displayBets = showAll ? bets : activeBets;

  if (loading) {
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
            <Badge variant="outline" className="text-xs">
              Available: ${userMoney.toFixed(2)}
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

          <div className="flex gap-2">
            <Button
              variant={!showAll ? "default" : "outline"}
              onClick={() => setShowAll(false)}
              size="sm"
              className={!showAll ? "bg-primary" : ""}
            >
              Active ({activeBets.length})
            </Button>
            <Button
              variant={showAll ? "default" : "outline"}
              onClick={() => setShowAll(true)}
              size="sm"
              className={showAll ? "bg-primary" : ""}
            >
              All Bets ({bets.length})
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {displayBets.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {showAll ? "No bets available" : "No active bets"}
          </Card>
        ) : (
          <div className="space-y-3">
            {displayBets.map((bet) => (
              <BetCard
                key={bet.bet_id}
                bet={bet}
                userId={userId}
                password={password}
                userMoney={userMoney}
                betsLocked={betsLocked}
                onBetPlaced={fetchBets}
                showEndButton={true}
                onEndBet={handleEndBetClick}
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
    </>
  );
}
