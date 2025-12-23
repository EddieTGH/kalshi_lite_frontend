"use client";

import { useState, useEffect } from "react";
import { BetWithPlacement, PartyMember } from "@/lib/types";
import { approveBet } from "@/app/api/bets";
import { getPartyMembers } from "@/app/api/parties";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EditApproveBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: BetWithPlacement;
  partyId: number;
  password: string;
  onBetApproved: () => Promise<void>;
}

export function EditApproveBetModal({
  open,
  onOpenChange,
  bet,
  partyId,
  password,
  onBetApproved,
}: EditApproveBetModalProps) {
  const [name, setName] = useState(bet.name);
  const [description, setDescription] = useState(bet.description || "");
  const [oddsForYes, setOddsForYes] = useState(bet.odds_for_yes.toString());
  const [peopleInvolved, setPeopleInvolved] = useState<number[]>(
    bet.people_involved || []
  );
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when bet changes
  useEffect(() => {
    setName(bet.name);
    setDescription(bet.description || "");
    setOddsForYes(bet.odds_for_yes.toString());
    setPeopleInvolved(bet.people_involved || []);
    setError("");
  }, [bet]);

  // Fetch party members
  useEffect(() => {
    if (open) {
      const fetchMembers = async () => {
        try {
          const data = await getPartyMembers(partyId, password);
          setMembers(data);
        } catch (err) {
          console.error("Failed to fetch party members", err);
        }
      };
      fetchMembers();
    }
  }, [open, partyId, password]);

  const toggleUser = (userId: number) => {
    if (peopleInvolved.includes(userId)) {
      setPeopleInvolved(peopleInvolved.filter((id) => id !== userId));
    } else {
      setPeopleInvolved([...peopleInvolved, userId]);
    }
  };

  const handleApprove = async () => {
    setError("");

    const odds = parseInt(oddsForYes);

    if (!name.trim()) {
      setError("Bet name is required");
      return;
    }

    if (odds < 0 || odds > 100) {
      setError("Odds must be between 0 and 100");
      return;
    }

    setLoading(true);

    try {
      // Check if anything changed
      const hasChanges =
        name.trim() !== bet.name ||
        (description.trim() || "") !== (bet.description || "") ||
        odds !== bet.odds_for_yes ||
        JSON.stringify(peopleInvolved.sort()) !==
          JSON.stringify((bet.people_involved || []).sort());

      if (hasChanges) {
        // Approve with edits
        await approveBet(
          bet.bet_id,
          {
            name: name.trim(),
            ...(description.trim() && { description: description.trim() }),
            odds_for_yes: odds,
            ...(peopleInvolved.length > 0 && {
              people_involved: peopleInvolved,
            }),
          },
          partyId,
          password
        );
      } else {
        // Approve as-is (no edits)
        await approveBet(bet.bet_id, undefined, partyId, password);
      }

      await onBetApproved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve bet");
    } finally {
      setLoading(false);
    }
  };

  const oddsForNo = 100 - parseInt(oddsForYes || "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit & Approve Bet</DialogTitle>
          <DialogDescription>
            Make any necessary changes and approve this pending bet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-muted border border-gray-500 border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Bet Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-bet-name">
              Bet Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-bet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bet name"
              maxLength={200}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-bet-description">Description (Optional)</Label>
            <Textarea
              id="edit-bet-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter bet description"
              maxLength={1000}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Odds */}
          <div className="space-y-2">
            <Label htmlFor="edit-odds-yes">
              Odds for YES (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-odds-yes"
              type="number"
              min="0"
              max="100"
              value={oddsForYes}
              onChange={(e) => setOddsForYes(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">YES: {oddsForYes}%</Badge>
              <Badge variant="outline">NO: {oddsForNo}%</Badge>
            </div>
          </div>

          {/* People Involved */}
          <div className="space-y-2">
            <Label>People Involved (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select people who cannot bet on this bet (they are involved in the
              outcome)
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = peopleInvolved.includes(member.user_id);
                return (
                  <Badge
                    key={member.user_id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => !loading && toggleUser(member.user_id)}
                  >
                    {member.name}
                    {isSelected && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-500"
          >
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? "Approving..." : "Approve Bet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
