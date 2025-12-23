"use client";

import { useState, useEffect } from "react";
import { PartyMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResolveStatus = "all" | "active" | "resolved";
export type ApprovalStatus = "all" | "pending" | "approved";

export interface BetFilterState {
  peopleInvolved: number[]; // Array of user IDs, empty array means "All"
  resolveStatus: ResolveStatus;
  approvalStatus: ApprovalStatus;
}

interface BetFiltersProps {
  partyMembers: PartyMember[];
  onApplyFilters: (filters: BetFilterState) => void;
  initialFilters?: BetFilterState;
}

export function BetFilters({
  partyMembers,
  onApplyFilters,
  initialFilters,
}: BetFiltersProps) {
  // Initialize with all people selected by default
  const [selectedPeople, setSelectedPeople] = useState<number[]>(
    initialFilters?.peopleInvolved || partyMembers.map((m) => m.user_id)
  );
  const [resolveStatus, setResolveStatus] = useState<ResolveStatus>(
    initialFilters?.resolveStatus || "all"
  );
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    initialFilters?.approvalStatus || "approved"
  );
  const [peoplePopoverOpen, setPeoplePopoverOpen] = useState(false);

  // Initialize selectedPeople when partyMembers loads
  useEffect(() => {
    // Only auto-initialize if no initial filters were provided
    if (
      partyMembers.length > 0 &&
      selectedPeople.length === 0 &&
      (!initialFilters || initialFilters.peopleInvolved.length === 0)
    ) {
      setSelectedPeople(partyMembers.map((m) => m.user_id));
    }
  }, [partyMembers]);

  // Check if all people are selected
  const isAllPeopleSelected = selectedPeople.length === partyMembers.length;

  // Toggle a specific person
  const togglePerson = (userId: number) => {
    setSelectedPeople((prev) => {
      const newPeople = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      applyFilters(newPeople, resolveStatus, approvalStatus);
      return newPeople;
    });
  };

  // Select all people
  const selectAllPeople = () => {
    const allPeopleIds = partyMembers.map((m) => m.user_id);
    setSelectedPeople(allPeopleIds);
    applyFilters(allPeopleIds, resolveStatus, approvalStatus);
  };

  // Deselect all people
  const deselectAllPeople = () => {
    setSelectedPeople([]);
    applyFilters([], resolveStatus, approvalStatus);
  };

  // Auto-apply filters whenever they change
  const applyFilters = (
    people: number[] = selectedPeople,
    resolve: ResolveStatus = resolveStatus,
    approval: ApprovalStatus = approvalStatus
  ) => {
    onApplyFilters({
      peopleInvolved: people,
      resolveStatus: resolve,
      approvalStatus: approval,
    });
  };

  // Reset filters
  const handleReset = () => {
    const allPeopleIds = partyMembers.map((m) => m.user_id);
    setSelectedPeople(allPeopleIds);
    setResolveStatus("all");
    setApprovalStatus("approved");
    onApplyFilters({
      peopleInvolved: allPeopleIds,
      resolveStatus: "all",
      approvalStatus: "approved",
    });
  };

  // Get display text for people filter
  const getPeopleDisplayText = () => {
    if (selectedPeople.length === 0) return "None selected";
    if (selectedPeople.length === partyMembers.length) return "All";
    if (selectedPeople.length === 1) {
      const member = partyMembers.find((m) => m.user_id === selectedPeople[0]);
      return member?.name || "1 selected";
    }
    return `${selectedPeople.length} selected`;
  };

  return (
    <Card className="p-4 space-y-4 bg-card dark:bg-gray-900">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Filter Bets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-sm"
          >
            Reset
          </Button>
        </div>

        {/* People Involved Filter */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            People Involved
          </Label>
          <Popover open={peoplePopoverOpen} onOpenChange={setPeoplePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-sm h-10 border-gray-500"
              >
                <span className="truncate">{getPeopleDisplayText()}</span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0 bg-card"
              align="start"
            >
              <div className="p-3 border-b space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPeople}
                    className="flex-1 h-8 text-xs border-gray-500"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllPeople}
                    className="flex-1 h-8 text-xs border-gray-500"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {partyMembers.map((member) => {
                  const isSelected = selectedPeople.includes(member.user_id);
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center space-x-2 py-2 px-2 hover:bg-accent rounded-sm cursor-pointer"
                      onClick={() => togglePerson(member.user_id)}
                    >
                      <Checkbox
                        id={`person-${member.user_id}`}
                        checked={isSelected}
                        onCheckedChange={() => togglePerson(member.user_id)}
                      />
                      <label
                        htmlFor={`person-${member.user_id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {member.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Resolve Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Resolve Status
          </Label>
          <div className="flex gap-2">
            <Button
              variant={resolveStatus === "all" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                resolveStatus === "all" && "bg-primary text-primary-foreground",
                resolveStatus !== "all" && "border-gray-500"
              )}
              onClick={() => {
                setResolveStatus("all");
                applyFilters(selectedPeople, "all", approvalStatus);
              }}
            >
              All
            </Button>
            <Button
              variant={resolveStatus === "active" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                resolveStatus === "active" &&
                  "bg-primary text-primary-foreground",
                resolveStatus !== "active" && "border-gray-500"
              )}
              onClick={() => {
                setResolveStatus("active");
                applyFilters(selectedPeople, "active", approvalStatus);
              }}
            >
              Unresolved
            </Button>
            <Button
              variant={resolveStatus === "resolved" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                resolveStatus === "resolved" &&
                  "bg-primary text-primary-foreground",
                resolveStatus !== "resolved" && "border-gray-500"
              )}
              onClick={() => {
                setResolveStatus("resolved");
                applyFilters(selectedPeople, "resolved", approvalStatus);
              }}
            >
              Resolved
            </Button>
          </div>
        </div>

        {/* Approval Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Approval Status
          </Label>
          <div className="flex gap-2">
            <Button
              variant={approvalStatus === "all" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                approvalStatus === "all" && "bg-primary text-primary-foreground",
                approvalStatus !== "all" && "border-gray-500"
              )}
              onClick={() => {
                setApprovalStatus("all");
                applyFilters(selectedPeople, resolveStatus, "all");
              }}
            >
              All
            </Button>
            <Button
              variant={approvalStatus === "approved" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                approvalStatus === "approved" &&
                  "bg-primary text-primary-foreground",
                approvalStatus !== "approved" && "border-gray-500"
              )}
              onClick={() => {
                setApprovalStatus("approved");
                applyFilters(selectedPeople, resolveStatus, "approved");
              }}
            >
              Approved
            </Button>
            <Button
              variant={approvalStatus === "pending" ? "default" : "outline"}
              className={cn(
                "flex-1 h-10",
                approvalStatus === "pending" &&
                  "bg-primary text-primary-foreground",
                approvalStatus !== "pending" && "border-gray-500"
              )}
              onClick={() => {
                setApprovalStatus("pending");
                applyFilters(selectedPeople, resolveStatus, "pending");
              }}
            >
              Pending
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
