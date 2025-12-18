"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserParties, getPartyMembers } from "@/app/api/parties";
import { PartyWithMembership } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Users, Copy, Edit, Check } from "lucide-react";
import { EditPartyModal } from "@/components/EditPartyModal";

interface PartyHeaderProps {
  onPartyChange?: () => void; // Callback when party is switched
}

export function PartyHeader({ onPartyChange }: PartyHeaderProps) {
  const { currentParty, setCurrentParty, password, user } = useAuth();
  const router = useRouter();
  const [parties, setParties] = useState<PartyWithMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch user's parties on mount
  useEffect(() => {
    const fetchParties = async () => {
      if (!password) return;

      try {
        setLoading(true);
        const userParties = await getUserParties(password);
        setParties(userParties);

        // If current party is set, update it with fresh data
        if (currentParty) {
          const updatedParty = userParties.find(
            (p) => p.party_id === currentParty.party_id
          );
          if (updatedParty) {
            setCurrentParty(updatedParty);
          }
        }
      } catch (err) {
        console.error("Failed to fetch parties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [password]);

  // Handle party selection from dropdown
  const handlePartySelect = (partyId: string) => {
    const selected = parties.find((p) => p.party_id === Number(partyId));
    if (selected) {
      setCurrentParty(selected);
      // Trigger callback to refresh data
      if (onPartyChange) {
        onPartyChange();
      }
    }
  };

  // Handle copy join code
  const handleCopyJoinCode = async () => {
    if (!currentParty) return;

    try {
      await navigator.clipboard.writeText(currentParty.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  // Handle party updated (refresh party list and current party)
  const handlePartyUpdated = async (updatedParty: PartyWithMembership) => {
    // Update current party
    setCurrentParty(updatedParty);

    // Refresh party list
    if (password) {
      try {
        const userParties = await getUserParties(password);
        setParties(userParties);
      } catch (err) {
        console.error("Failed to refresh parties:", err);
      }
    }

    setShowEditModal(false);

    // Trigger callback to refresh data
    if (onPartyChange) {
      onPartyChange();
    }
  };

  if (!currentParty) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Party Selector Dropdown */}
      <div className="flex items-center gap-3">
        <Select
          value={currentParty.party_id.toString()}
          onValueChange={handlePartySelect}
          disabled={loading}
        >
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select a party" />
          </SelectTrigger>
          <SelectContent>
            {parties.map((party) => (
              <SelectItem key={party.party_id} value={party.party_id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{party.name}</span>
                  {party.is_admin && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/party-selection")}
        >
          Switch Party
        </Button>
      </div>

      {/* Party Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{currentParty.name}</CardTitle>
                {currentParty.is_admin && (
                  <Badge variant="default">Admin</Badge>
                )}
              </div>
              {currentParty.description && (
                <CardDescription>{currentParty.description}</CardDescription>
              )}
            </div>

            {/* Edit Button (Admin Only) */}
            {currentParty.is_admin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditModal(true)}
                title="Edit party settings"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Party Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(currentParty.date).toLocaleDateString()}</span>
            </div>

            {/* Member Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{currentParty.member_count} members</span>
            </div>

            {/* Join Code with Copy Button */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-base">
                {currentParty.join_code}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyJoinCode}
                title="Copy join code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Starting Balance Info */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Starting balance: ${currentParty.starting_balance}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Party Modal (Admin Only) */}
      {currentParty.is_admin && (
        <EditPartyModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          party={currentParty}
          onPartyUpdated={handlePartyUpdated}
        />
      )}
    </div>
  );
}
