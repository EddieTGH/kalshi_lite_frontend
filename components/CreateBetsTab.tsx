"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyMember } from "@/lib/types";
import { createBet } from "@/app/api/bets";
import { getPartyMembers } from "@/app/api/parties";
import { useBetsCache } from "@/lib/bets-cache-context";
import { X } from "lucide-react";

interface CreateBetsTabProps {
  partyId: number; // Party ID is now required
  password: string;
  onBetCreated?: () => Promise<void>;
}

export function CreateBetsTab({
  partyId,
  password,
  onBetCreated,
}: CreateBetsTabProps) {
  const { invalidateCache } = useBetsCache();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [oddsForYes, setOddsForYes] = useState("50");
  const [peopleInvolved, setPeopleInvolved] = useState<number[]>([]);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch party members for "people involved" selection
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getPartyMembers(partyId, password);
        setMembers(data);
      } catch (err) {
        console.error("Failed to fetch party members", err);
      }
    };
    fetchMembers();
  }, [partyId, password]); // Re-fetch when party changes

  const toggleUser = (userId: number) => {
    if (peopleInvolved.includes(userId)) {
      setPeopleInvolved(peopleInvolved.filter((id) => id !== userId));
    } else {
      setPeopleInvolved([...peopleInvolved, userId]);
    }
  };

  // Handle form submission - create bet in current party
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      await createBet(
        {
          name: name.trim(),
          ...(description.trim() && { description: description.trim() }),
          odds_for_yes: odds,
          people_involved: peopleInvolved,
        },
        partyId,
        password
      );
      // Invalidate cache to refresh all bet data
      await invalidateCache();

      setSuccess("Bet created successfully!");
      setName("");
      setDescription("");
      setOddsForYes("50");
      setPeopleInvolved([]);

      // Wait for any additional callback (like tab navigation) to complete
      if (onBetCreated) {
        await onBetCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create New Bet</h2>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-secondary/10 p-4 text-sm text-secondary">
          {success}
        </div>
      )}

      <Card className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Bet Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Will it rain tomorrow?"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Will it rain in San Francisco tomorrow?"
              maxLength={1000}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="odds">Odds for YES (%) *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="odds"
                type="number"
                value={oddsForYes}
                onChange={(e) => setOddsForYes(e.target.value)}
                min="0"
                max="100"
                className="max-w-[120px]"
              />
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>YES: {oddsForYes}%</span>
                <span>•</span>
                <span>NO: {100 - parseInt(oddsForYes || "0")}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>People Involved (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select party members who are involved in the outcome. They
              won&apos;t be able to bet on this.
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => toggleUser(member.user_id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    peopleInvolved.includes(member.user_id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {member.name}
                  {peopleInvolved.includes(member.user_id) && (
                    <X className="inline-block ml-1 h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Bet"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
