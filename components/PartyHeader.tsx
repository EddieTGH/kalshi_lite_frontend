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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Users, Copy, Edit, Check, ChevronDown } from "lucide-react";
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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

      {/* Party Details Card - Compact with Expandable Details */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{currentParty.name}</CardTitle>
              {currentParty.is_admin && (
                <Badge variant="default" className="text-xs">Admin</Badge>
              )}
            </div>

            {/* Edit Button (Admin Only) */}
            {currentParty.is_admin && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEditModal(true)}
                title="Edit party settings"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          {/* Join Code and Show Details - Same Line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Join Code:</span>
              <Badge variant="outline" className="font-mono text-sm">
                {currentParty.join_code}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyJoinCode}
                title="Copy join code"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Expandable Details Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="gap-1 h-7 text-xs px-2"
            >
              <span>Show Details</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  detailsExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {/* Expandable Details */}
          {detailsExpanded && (
            <div className="mt-3 pt-3 border-t space-y-3">
              {/* Description */}
              {currentParty.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{currentParty.description}</p>
                </div>
              )}

              {/* Party Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Member Count */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Members</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    <span>{currentParty.member_count}</span>
                  </div>
                </div>

                {/* Party Date */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Date</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(currentParty.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Starting Balance */}
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Starting Balance</p>
                  <p className="text-sm">${currentParty.starting_balance}</p>
                </div>
              </div>
            </div>
          )}
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
