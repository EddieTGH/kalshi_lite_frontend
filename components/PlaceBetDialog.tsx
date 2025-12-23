"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BetWithPlacement } from "@/lib/types";
import { placeBet } from "@/app/api/userPlacedBets";

interface PlaceBetDialogProps {
  bet: BetWithPlacement;
  userId: number;
  partyId: number; // Party ID is now required
  password: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>; // Make this async to wait for refresh
  availableMoney: number;
  onMoneyChange: (newMoney: number) => Promise<void>;
}

export function PlaceBetDialog({
  bet,
  userId,
  partyId,
  password,
  open,
  onOpenChange,
  onSuccess,
  availableMoney,
  onMoneyChange,
}: PlaceBetDialogProps) {
  const [amount, setAmount] = useState("");
  const [decision, setDecision] = useState<"yes" | "no">("yes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculatePayout = () => {
    const amountNum = parseFloat(amount) || 0;
    const odds = decision === "yes" ? bet.odds_for_yes : bet.odds_for_no;
    const payout = amountNum * (1 / (odds / 100));
    const profit = payout - amountNum;
    return { payout, profit };
  };

  const { payout, profit } = calculatePayout();

  // Handle place bet with party_id
  const handleSubmit = async () => {
    setError("");

    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum < 1) {
      setError("Minimum bet amount is $1");
      return;
    }

    setLoading(true);

    try {
      const response = await placeBet(
        {
          user_id: userId,
          bet_id: bet.bet_id,
          amount: amountNum,
          decision,
        },
        partyId,
        password
      );
      // Update available money and wait for cache refresh
      await onMoneyChange(response.user_money_remaining);

      // Wait for refresh to complete before closing modal
      await onSuccess();

      onOpenChange(false);
      setAmount("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing while loading
        if (!loading) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bet.name}</DialogTitle>
          <DialogDescription className="text-sm">
            {bet.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Choose Outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={decision === "yes" ? "default" : "outline"}
                className={decision === "yes" ? "bg-primary" : "border-gray-500"}
                onClick={() => setDecision("yes")}
              >
                <div className={`flex flex-col items-center w-full`}>
                  <span className="font-semibold">YES</span>
                  <span className="text-xs opacity-80">
                    {bet.odds_for_yes}% odds
                  </span>
                </div>
              </Button>
              <Button
                type="button"
                variant={decision === "no" ? "default" : "outline"}
                className={decision === "no" ? "bg-secondary" : "border-gray-500"}
                onClick={() => setDecision("no")}
              >
                <div className={`flex flex-col items-center w-full`}>
                  <span className="font-semibold">NO</span>
                  <span className="text-xs opacity-80">
                    {bet.odds_for_no}% odds
                  </span>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Bet</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="1"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Available: ${availableMoney.toFixed(2)}
            </p>
          </div>

          {amount && parseFloat(amount) >= 1 && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Payout:</span>
                <span className="font-semibold">${payout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Profit:</span>
                <span
                  className={`font-semibold ${
                    profit > 0 ? "text-primary" : ""
                  }`}
                >
                  {profit > 0 ? "+" : ""}${profit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 sm:flex-initial border-gray-500"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) < 1}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
          >
            {loading ? "Placing..." : "Place Bet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
