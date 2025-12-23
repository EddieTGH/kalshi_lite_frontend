"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetWithPlacement, PartyMember } from "@/lib/types";
import { PlaceBetDialog } from "./PlaceBetDialog";
import { EditApproveBetModal } from "./EditApproveBetModal";
import { deletePlacedBet } from "@/app/api/userPlacedBets";
import { approveBet, denyBet } from "@/app/api/bets";
import { Trash2, ChevronDown, Clock, Check, X, Edit } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BetCardProps {
  bet: BetWithPlacement;
  userId: number;
  partyId: number; // Party ID is now required
  password: string;
  betsLocked: boolean;
  onBetPlaced: () => Promise<void>; // Make this async to wait for refresh
  showEndButton?: boolean;
  onEndBet?: (betId: number) => void;
  availableMoney: number;
  onMoneyChange: (newMoney: number) => void;
  isAdmin?: boolean;
  partyMembers?: PartyMember[];
  onBetUpdated?: () => void;
}

export function BetCard({
  bet,
  userId,
  partyId,
  password,
  betsLocked,
  onBetPlaced,
  showEndButton = false,
  onEndBet,
  availableMoney,
  onMoneyChange,
  isAdmin = false,
  partyMembers = [],
  onBetUpdated,
}: BetCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editApproveModalOpen, setEditApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);

  const isPending = bet.status === "pending";

  // Handle remove placed bet with party_id
  const handleRemoveBet = async () => {
    if (!bet.user_placement.has_placed || !bet.user_placement.placed_bet_id)
      return;

    if (
      !confirm(
        "Are you sure you want to remove this bet? Your money will be refunded."
      )
    ) {
      return;
    }

    setRemoving(true);
    try {
      const response = await deletePlacedBet(
        bet.user_placement.placed_bet_id,
        partyId,
        password
      );
      // Update available money immediately
      onMoneyChange(response.user_money_remaining);

      // Wait for refresh to complete before hiding "Removing..." state
      await onBetPlaced();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to remove bet");
    } finally {
      setRemoving(false);
    }
  };

  // Handle quick approve (without edits)
  const handleQuickApprove = async () => {
    if (!confirm("Are you sure you want to approve this bet as-is?")) {
      return;
    }

    setApproving(true);
    try {
      await approveBet(bet.bet_id, undefined, partyId, password);
      onBetUpdated?.();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve bet");
    } finally {
      setApproving(false);
    }
  };

  // Handle deny bet
  const handleDeny = async () => {
    if (!confirm("Are you sure you want to deny and delete this bet?")) {
      return;
    }

    setDenying(true);
    try {
      await denyBet(bet.bet_id, partyId, password);
      onBetUpdated?.();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deny bet");
    } finally {
      setDenying(false);
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
              <Badge
                variant={placement.decision === "yes" ? "default" : "secondary"}
                className="ml-1"
              >
                {placement.decision?.toUpperCase()}
              </Badge>
            </span>
          </div>
        </div>

        {placement.resolved ? (
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Payout:
              </span>
              <span className="font-semibold text-base">
                ${placement.actual_payout?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-0 ml-auto">
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Profit/Loss:
              </span>
              <span
                className={`font-bold text-base ${
                  placement.actual_profit! >= 0
                    ? "text-secondary"
                    : "text-destructive"
                }`}
              >
                {placement.actual_profit! >= 0 ? "+" : ""}$
                {placement.actual_profit?.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Payout:</span>
              <span className="font-semibold">
                ${placement.potential_payout?.toFixed(2)}
              </span>
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
      <Card className="p-4 sm:p-5 relative">
        <div className="space-y-3">
          {/* Pending Icon in Top Right */}
          {isPending && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 pr-20">
              <h3 className="font-semibold text-base sm:text-lg leading-tight">
                {bet.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {bet.description}
              </p>
            </div>
            {!bet.in_progress && !isPending && (
              <Badge variant="outline" className="flex-shrink-0">
                Ended
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div
              className={`rounded-lg p-3 ${
                !bet.in_progress && bet.outcome === "yes"
                  ? "bg-primary/20 border-2 border-primary"
                  : "bg-muted"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div
                className={`text-lg sm:text-xl font-bold ${
                  !bet.in_progress && bet.outcome === "yes"
                    ? "text-primary"
                    : "text-primary"
                }`}
              >
                {bet.odds_for_yes}%
              </div>
              {!bet.in_progress && bet.outcome === "yes" && (
                <Badge variant="default" className="mt-1 text-xs">
                  Winner
                </Badge>
              )}
            </div>
            <div
              className={`rounded-lg p-3 ${
                !bet.in_progress && bet.outcome === "no"
                  ? "bg-secondary/20 border-2 border-secondary"
                  : "bg-muted"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div
                className={`text-lg sm:text-xl font-bold ${
                  !bet.in_progress && bet.outcome === "no"
                    ? "text-secondary"
                    : "text-secondary"
                }`}
              >
                {bet.odds_for_no}%
              </div>
              {!bet.in_progress && bet.outcome === "no" && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Winner
                </Badge>
              )}
            </div>
          </div>

          {/* Participant Details Dropdown for Resolved Bets */}
          {!bet.in_progress && bet.payouts && bet.payouts.length > 0 && (
            <Collapsible
              open={detailsOpen}
              onOpenChange={setDetailsOpen}
              className="mt-3"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between"
                >
                  <span className="text-sm font-medium">
                    Bet Details ({bet.payouts.length} participant
                    {bet.payouts.length !== 1 ? "s" : ""})
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      detailsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="border rounded-lg divide-y">
                  {bet.payouts.map((payout) => (
                    <div key={payout.user_id} className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          {payout.user_name}
                        </span>
                        <Badge
                          variant={
                            payout.decision === "yes" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {payout.decision.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Bet:</span>
                          <div className="font-medium">
                            ${payout.amount_bet.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payout:</span>
                          <div className="font-medium">
                            ${payout.payout.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit:</span>
                          <div
                            className={`font-bold ${
                              payout.profit >= 0
                                ? "text-primary"
                                : "text-destructive"
                            }`}
                          >
                            {payout.profit >= 0 ? "+" : ""}$
                            {payout.profit.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {renderPlacementInfo()}

          {/* Admin Actions for Pending Bets */}
          {isPending && isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleQuickApprove}
                disabled={approving || denying}
                size="sm"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                {approving ? "Approving..." : "Approve"}
              </Button>
              <Button
                onClick={() => setEditApproveModalOpen(true)}
                disabled={approving || denying}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit & Approve
              </Button>
              <Button
                onClick={handleDeny}
                disabled={approving || denying}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                {denying ? "Denying..." : "Deny"}
              </Button>
            </div>
          )}

          {/* Place Bet Button (only for approved bets) */}
          {!isPending && bet.in_progress && !bet.user_placement.has_placed && (
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={betsLocked}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {betsLocked ? "Betting Locked" : "Place Bet"}
            </Button>
          )}

          {/* End Bet Button (only for approved bets) */}
          {!isPending && showEndButton && bet.in_progress && onEndBet && (
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

      {/* Edit & Approve Modal */}
      {isPending && isAdmin && (
        <EditApproveBetModal
          open={editApproveModalOpen}
          onOpenChange={setEditApproveModalOpen}
          bet={bet}
          partyId={partyId}
          password={password}
          onBetApproved={() => onBetUpdated?.()}
        />
      )}

      <PlaceBetDialog
        bet={bet}
        userId={userId}
        partyId={partyId}
        password={password}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onBetPlaced}
        availableMoney={availableMoney}
        onMoneyChange={onMoneyChange}
      />
    </>
  );
}
