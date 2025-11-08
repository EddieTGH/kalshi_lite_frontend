"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetWithPlacement } from "@/lib/types";
import { PlaceBetDialog } from "./PlaceBetDialog";
import { deletePlacedBet } from "@/app/api/userPlacedBets";
import { Trash2 } from "lucide-react";

interface BetCardProps {
  bet: BetWithPlacement;
  userId: number;
  password: string;
  userMoney: number;
  betsLocked: boolean;
  onBetPlaced: () => void;
  showEndButton?: boolean;
  onEndBet?: (betId: number) => void;
}

export function BetCard({
  bet,
  userId,
  password,
  userMoney,
  betsLocked,
  onBetPlaced,
  showEndButton = false,
  onEndBet,
}: BetCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemoveBet = async () => {
    if (!bet.user_placement.has_placed || !bet.user_placement.placed_bet_id) return;

    if (!confirm("Are you sure you want to remove this bet? Your money will be refunded.")) {
      return;
    }

    setRemoving(true);
    try {
      await deletePlacedBet(bet.user_placement.placed_bet_id, password);
      onBetPlaced();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove bet");
    } finally {
      setRemoving(false);
    }
  };

  const renderPlacementInfo = () => {
    if (!bet.user_placement.has_placed) return null;

    const placement = bet.user_placement;

    return (
      <div className="mt-4 space-y-2 border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your Bet:</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              ${placement.amount?.toFixed(2)} on{" "}
              <Badge variant={placement.decision === "yes" ? "default" : "secondary"} className="ml-1">
                {placement.decision?.toUpperCase()}
              </Badge>
            </span>
          </div>
        </div>

        {placement.resolved ? (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Result:</span>
              <Badge variant={bet.outcome === "yes" ? "default" : "secondary"}>
                {bet.outcome?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payout:</span>
              <span className="font-semibold">${placement.actual_payout?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit/Loss:</span>
              <span className={`font-bold ${placement.actual_profit! >= 0 ? "text-secondary" : "text-destructive"}`}>
                {placement.actual_profit! >= 0 ? "+" : ""}${placement.actual_profit?.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Payout:</span>
              <span className="font-semibold">${placement.potential_payout?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Profit:</span>
              <span className="font-semibold text-secondary">
                +${placement.potential_profit?.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {!bet.user_placement.resolved && !betsLocked && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveBet}
            disabled={removing}
            className="w-full mt-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {removing ? "Removing..." : "Remove Bet"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="p-4 sm:p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg leading-tight">
                {bet.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {bet.description}
              </p>
            </div>
            {!bet.in_progress && (
              <Badge variant="outline" className="flex-shrink-0">
                Ended
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div className="text-lg sm:text-xl font-bold text-primary">
                {bet.odds_for_yes}%
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div className="text-lg sm:text-xl font-bold text-secondary">
                {bet.odds_for_no}%
              </div>
            </div>
          </div>

          {renderPlacementInfo()}

          {bet.in_progress && !bet.user_placement.has_placed && (
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={betsLocked}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {betsLocked ? "Betting Locked" : "Place Bet"}
            </Button>
          )}

          {showEndButton && bet.in_progress && onEndBet && (
            <Button
              onClick={() => onEndBet(bet.bet_id)}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
            >
              End Bet
            </Button>
          )}
        </div>
      </Card>

      <PlaceBetDialog
        bet={bet}
        userId={userId}
        password={password}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onBetPlaced}
        userMoney={userMoney}
      />
    </>
  );
}
