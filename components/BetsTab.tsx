"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement } from "@/lib/types";
import { getBetsForUser } from "@/app/api/bets";
import { getLockStatus } from "@/app/api/settings";
import { BetCard } from "./BetCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BetsTabProps {
  userId: number;
  password: string;
  userMoney: number;
}

export function BetsTab({ userId, password, userMoney }: BetsTabProps) {
  const [bets, setBets] = useState<BetWithPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [betsLocked, setBetsLocked] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
            <Badge variant="outline" className="text-xs">
              Available: ${userMoney.toFixed(2)}
            </Badge>
          </div>
        </div>

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
            />
          ))}
        </div>
      )}
    </div>
  );
}
