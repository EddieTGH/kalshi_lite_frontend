"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { joinParty } from "@/app/api/parties";
import { PartyWithMembership } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinPartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartyJoined: (party: PartyWithMembership) => void;
}

export function JoinPartyModal({
  open,
  onOpenChange,
  onPartyJoined,
}: JoinPartyModalProps) {
  const { password } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setJoinCode("");
      setError("");
    }
    onOpenChange(newOpen);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Not authenticated");
      return;
    }

    // Validate join code format (3 uppercase letters)
    const upperJoinCode = joinCode.toUpperCase();
    if (!/^[A-Z]{3}$/.test(upperJoinCode)) {
      setError("Join code must be exactly 3 letters (A-Z)");
      return;
    }

    setLoading(true);

    try {
      const joinedParty = await joinParty(
        { join_code: upperJoinCode },
        password
      );

      // Convert to PartyWithMembership
      const partyWithMembership: PartyWithMembership = {
        party_id: joinedParty.party_id,
        name: joinedParty.name,
        description: joinedParty.description,
        date: joinedParty.date,
        join_code: joinedParty.join_code,
        locked_status: joinedParty.locked_status,
        starting_balance: joinedParty.starting_balance,
        created_at: joinedParty.created_at,
        is_admin: false, // New member is not admin by default
        member_count: 1, // We don't know the exact count, but user is now a member
      };

      onPartyJoined(partyWithMembership);
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Failed to join party:", err);
      if (err.response?.status === 404) {
        setError("Party not found. Please check the join code.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to join party. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join Party</DialogTitle>
          <DialogDescription>
            Enter the 3-letter join code to join an existing party
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Join Code */}
          <div className="space-y-2">
            <Label htmlFor="joinCode">
              Join Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="joinCode"
              placeholder="ABC"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={3}
              className="text-center text-xl font-mono tracking-widest"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter the 3-letter code shared by the party admin
            </p>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || joinCode.length !== 3}>
              {loading ? "Joining..." : "Join Party"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
