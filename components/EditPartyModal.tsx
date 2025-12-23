"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  updateParty,
  getPartyMembers,
  updatePartyMember,
} from "@/app/api/parties";
import { PartyWithMembership, PartyMember } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Crown } from "lucide-react";

interface EditPartyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party: PartyWithMembership;
  onPartyUpdated: (party: PartyWithMembership) => void;
}

export function EditPartyModal({
  open,
  onOpenChange,
  party,
  onPartyUpdated,
}: EditPartyModalProps) {
  const { password, user } = useAuth();

  // Party info form state
  const [name, setName] = useState(party.name);
  const [description, setDescription] = useState(party.description || "");
  const [date, setDate] = useState(
    new Date(party.date).toISOString().split("T")[0]
  );
  const [startingBalance, setStartingBalance] = useState(
    party.starting_balance
  );

  // Members state
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when party changes or modal opens
  useEffect(() => {
    if (open) {
      setName(party.name);
      setDescription(party.description || "");
      setDate(new Date(party.date).toISOString().split("T")[0]);
      setStartingBalance(party.starting_balance);
      setError("");
      fetchMembers();
    }
  }, [open, party]);

  // Fetch party members
  const fetchMembers = async () => {
    if (!password) return;

    try {
      setLoadingMembers(true);
      const partyMembers = await getPartyMembers(party.party_id, password);
      setMembers(partyMembers);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Handle party info update
  const handleUpdatePartyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);

    try {
      const updatedParty = await updateParty(
        party.party_id,
        {
          name,
          description: description || undefined,
          date,
          starting_balance: startingBalance,
        },
        password
      );

      // Convert to PartyWithMembership
      const partyWithMembership: PartyWithMembership = {
        ...updatedParty,
        is_admin: party.is_admin,
        member_count: party.member_count,
      };

      onPartyUpdated(partyWithMembership);
    } catch (err: any) {
      console.error("Failed to update party:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update party. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle admin status for a member
  const handleToggleAdmin = async (member: PartyMember) => {
    if (!password) return;

    try {
      // Update member's admin status
      await updatePartyMember(
        party.party_id,
        member.user_id,
        { admin: !member.admin },
        password
      );

      // Refresh members list
      await fetchMembers();
    } catch (err: any) {
      console.error("Failed to update member:", err);
      alert(
        err.response?.data?.message ||
          "Failed to update member. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Party Settings</DialogTitle>
          <DialogDescription>
            Update party information and manage members
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Party Info</TabsTrigger>
            <TabsTrigger value="members">Members & Admins</TabsTrigger>
          </TabsList>

          {/* Party Info Tab */}
          <TabsContent value="info">
            <form onSubmit={handleUpdatePartyInfo} className="space-y-4 mt-4">
              {/* Party Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Party Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
              </div>

              {/* Party Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-date">Party Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Starting Balance */}
              <div className="space-y-2">
                <Label htmlFor="edit-startingBalance">
                  Starting Balance ($)
                </Label>
                <Input
                  id="edit-startingBalance"
                  type="number"
                  min={0}
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Note: Changing this won't affect existing members
                </p>
              </div>

              {/* Error Message */}
              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-gray-500"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Members & Admins Tab */}
          <TabsContent value="members">
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Promote members to admin to give them permission to create bets,
                end bets, and manage party settings.
              </p>

              {/* Loading State */}
              {loadingMembers && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading members...
                </div>
              )}

              {/* Members List */}
              {!loadingMembers && members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isCurrentUser = user?.user_id === member.user_id;

                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 border border-gray-500 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ${member.money} available • ${member.total_money}{" "}
                              total
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.admin && (
                            <Badge variant="default" className="gap-1">
                              <Crown className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          <Switch
                            checked={member.admin}
                            onCheckedChange={() => handleToggleAdmin(member)}
                            disabled={isCurrentUser} // Can't change own admin status
                            aria-label={`Make ${member.name} admin`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {!loadingMembers && members.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No members found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
