"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBetsCache } from "@/lib/bets-cache-context";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

// No props needed - all data comes from cache
export function LeaderboardTab() {
  /**
   * USE BETS CACHE
   * Read from shared cache - this provides instant display when switching tabs
   * The cache is automatically refreshed every 30 seconds in the background
   * Leaderboard data comes from cache.partyMembers
   */
  const { cache, loading, invalidateCache } = useBetsCache();

  // Extract party members from cache (sorted by total_money descending)
  const members = cache.partyMembers;

  // Local state for UI interactions only
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);

  /**
   * MANUAL REFRESH
   * Triggered by the refresh button
   * Calls silent cache invalidation (no loading spinner, smooth update)
   */
  const handleManualRefresh = async () => {
    await invalidateCache();
  };

  // Show loading only on initial load (when cache is empty)
  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {members.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          No members found in this party
        </Card>
      )}

      <div className="space-y-3">
        {members.map((member, index) => {
          const isExpanded = expandedMemberId === member.user_id;
          const hasBetHistory =
            member.bet_history && member.bet_history.length > 0;

          return (
            <Card key={member.user_id} className="overflow-hidden">
              {/* Member Header - Clickable */}
              <div
                className={`px-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  hasBetHistory ? "" : "cursor-default"
                }`}
                onClick={() => {
                  if (hasBetHistory) {
                    setExpandedMemberId(isExpanded ? null : member.user_id);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && (
                        <span className="text-lg font-semibold text-muted-foreground w-8 text-center inline-block">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{member.name}</p>
                        {member.admin && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-secondary text-secondary-foreground flex-shrink-0"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary">
                        ${member.total_money.toFixed(2)}
                      </p>
                      {/* <p className="text-xs text-muted-foreground">Total</p> */}
                    </div>
                    {hasBetHistory && (
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Bet History Section */}
              {isExpanded && hasBetHistory && (
                <div
                  className="border-t bg-muted/20 cursor-pointer"
                  onClick={() => setExpandedMemberId(null)}
                >
                  <div className="px-4 pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Bet History
                    </h3>
                    <div className="space-y-2">
                      {member.bet_history!.map((bet) => {
                        const isWin = bet.profit > 0;
                        const isLoss = bet.profit < 0;
                        const wasCorrect = bet.decision === bet.outcome;

                        return (
                          <div
                            key={bet.bet_id}
                            // className="bg-card rounded-lg border border-gray-500 p-3 space-y-2"
                            className={`bg-muted rounded-lg border p-3 space-y-2 ${
                              wasCorrect
                                ? "border-primary"
                                : "border-destructive"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {bet.bet_name}
                                </p>
                                {/* {bet.bet_description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {bet.bet_description}
                                  </p>
                                )} */}
                              </div>
                              {/* <Badge
                                variant={wasCorrect ? "outline" : "destructive"}
                                className={`flex-shrink-0 text-xs ${
                                  wasCorrect
                                    ? "bg-green-500 border-green-600"
                                    : ""
                                }`}
                              >
                                {wasCorrect ? "✓" : "✗"}{" "}
                                {bet.decision.toUpperCase()}
                              </Badge> */}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-foreground">Bet Amount</p>
                                <p className="font-semibold">
                                  ${bet.amount_bet.toFixed(2)}
                                </p>
                              </div>
                              {/* <div>
                                <p className="text-muted-foreground">Payout</p>
                                <p className="font-semibold">
                                  ${bet.payout.toFixed(2)}
                                </p>
                              </div> */}
                              <div>
                                <p className="text-foreground">Profit/Loss</p>
                                <p
                                  className={`font-semibold ${
                                    isWin
                                      ? "text-primary"
                                      : isLoss
                                      ? "text-destructive"
                                      : "text-foreground"
                                  }`}
                                >
                                  {bet.profit > 0 ? "+" : ""}$
                                  {bet.profit.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-foreground">Resolved To</p>
                                <p className="font-semibold uppercase">
                                  {bet.outcome}
                                </p>
                              </div>
                            </div>

                            {/* <div className="pt-2 border-t text-xs text-muted-foreground">
                              <p>
                                Resolved: {new Date(bet.resolved_at).toLocaleDateString()}
                              </p>
                            </div> */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
