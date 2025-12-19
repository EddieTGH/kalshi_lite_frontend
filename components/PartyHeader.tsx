"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PartyWithMembership } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Copy, Edit, Check, ChevronDown } from "lucide-react";
import { EditPartyModal } from "@/components/EditPartyModal";

interface PartyHeaderProps {
  onPartyChange?: () => void; // Callback when party is switched
}

export function PartyHeader({ onPartyChange }: PartyHeaderProps) {
  const { currentParty, setCurrentParty, password } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

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

  // Handle party updated
  const handlePartyUpdated = async (updatedParty: PartyWithMembership) => {
    // Update current party
    setCurrentParty(updatedParty);

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
    <div>
      {/* Party Details Card - Compact with Expandable Details */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{currentParty.name}</CardTitle>
              {currentParty.is_admin && (
                <Badge variant="default" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Switch Party Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/party-selection")}
              >
                Switch Party
              </Button>

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
          </div>
        </CardHeader>

        <CardContent className="pt-0">
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
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{currentParty.description}</p>
                </div>
              )}

              {/* Party Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Member Count */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Members
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    <span>{currentParty.member_count}</span>
                  </div>
                </div>

                {/* Party Date */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Date
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(currentParty.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Starting Balance */}
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Starting Balance
                  </p>
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
