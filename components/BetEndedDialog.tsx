"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EndBetResponse } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface BetEndedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  betResult: EndBetResponse | null;
}

export function BetEndedDialog({
  open,
  onOpenChange,
  betResult,
}: BetEndedDialogProps) {
  if (!betResult) return null;

  const winners = betResult.payouts.filter((p) => p.profit > 0);
  const losers = betResult.payouts.filter((p) => p.profit <= 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Bet Ended: {betResult.name}
          </DialogTitle>
          <DialogDescription>
            Final outcome and payout details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Outcome Badge */}
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <span className="text-lg font-semibold">Final Outcome:</span>
            <Badge
              variant={betResult.outcome === "yes" ? "default" : "secondary"}
              className="text-lg px-4 py-2"
            >
              {betResult.outcome?.toUpperCase()}
            </Badge>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg border border-primary">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Winners
                </span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {winners.length}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg border border-destructive">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-foreground">
                  Losers
                </span>
              </div>
              <div className="text-3xl font-bold text-destructive">
                {losers.length}
              </div>
            </div>
          </div>

          {/* Winners Section */}
          {winners.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                Winners
              </h3>
              <div className="space-y-2">
                {winners.map((payout) => (
                  <div
                    key={payout.user_id}
                    className="p-3 bg-muted border border-primary rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{payout.user_name}</span>
                      <Badge
                        variant={payout.decision === "yes" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {payout.decision.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bet:</span>
                        <div className="font-medium">${payout.amount_bet.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payout:</span>
                        <div className="font-medium">${payout.payout.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profit:</span>
                        <div className="font-bold text-primary">
                          +${payout.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Losers Section */}
          {losers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Losers
              </h3>
              <div className="space-y-2">
                {losers.map((payout) => (
                  <div
                    key={payout.user_id}
                    className="p-3 bg-muted border border-destructive rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{payout.user_name}</span>
                      <Badge
                        variant={payout.decision === "yes" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {payout.decision.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bet:</span>
                        <div className="font-medium">${payout.amount_bet.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payout:</span>
                        <div className="font-medium">${payout.payout.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loss:</span>
                        <div className="font-bold text-destructive">
                          ${payout.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
