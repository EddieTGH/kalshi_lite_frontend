"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createParty } from "@/app/api/parties";
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
import { Textarea } from "@/components/ui/textarea";

interface CreatePartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartyCreated: (party: PartyWithMembership) => void;
}

export function CreatePartyModal({
  open,
  onOpenChange,
  onPartyCreated,
}: CreatePartyModalProps) {
  const { password } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startingBalance, setStartingBalance] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDescription("");
      setDate("");
      setStartingBalance(100);
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

    // Validate date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError("Party date must be in the future");
      return;
    }

    setLoading(true);

    try {
      const newParty = await createParty(
        {
          name,
          description: description || undefined,
          date, // Send as YYYY-MM-DD string
          starting_balance: startingBalance,
        },
        password
      );

      // Convert to PartyWithMembership (creator is automatically admin)
      const partyWithMembership: PartyWithMembership = {
        ...newParty,
        is_admin: true,
        member_count: 1,
      };

      onPartyCreated(partyWithMembership);
      handleOpenChange(false);
    } catch (err: any) {
      console.error("Failed to create party:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create party. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Party</DialogTitle>
          <DialogDescription>
            Create a new betting party for your friends. You'll be the admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Party Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Party Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="New Year's Eve 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="NYE betting party with friends"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          {/* Party Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Party Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getTodayDate()}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be a future date
            </p>
          </div>

          {/* Starting Balance */}
          <div className="space-y-2">
            <Label htmlFor="startingBalance">
              Starting Balance ($)
            </Label>
            <Input
              id="startingBalance"
              type="number"
              min={0}
              value={startingBalance}
              onChange={(e) => setStartingBalance(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Default balance for all members
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
              className="border-gray-500"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Party"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
