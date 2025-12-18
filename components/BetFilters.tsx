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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, X } from "lucide-react";

export type ResolveStatus = "all" | "active" | "resolved";
export type InvestedStatus = "all" | "invested" | "not-invested";

export interface BetFilterState {
  peopleInvolved: number[]; // Array of user IDs, empty array means "All"
  resolveStatus: ResolveStatus;
  investedStatus: InvestedStatus;
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
  const [investedStatus, setInvestedStatus] = useState<InvestedStatus>(
    initialFilters?.investedStatus || "all"
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
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Select all people
  const selectAllPeople = () => {
    setSelectedPeople(partyMembers.map((m) => m.user_id));
  };

  // Deselect all people
  const deselectAllPeople = () => {
    setSelectedPeople([]);
  };

  // Handle submit
  const handleSubmit = () => {
    onApplyFilters({
      peopleInvolved: selectedPeople,
      resolveStatus,
      investedStatus,
    });
  };

  // Reset filters
  const handleReset = () => {
    const allPeopleIds = partyMembers.map((m) => m.user_id);
    setSelectedPeople(allPeopleIds);
    setResolveStatus("all");
    setInvestedStatus("all");
    onApplyFilters({
      peopleInvolved: allPeopleIds,
      resolveStatus: "all",
      investedStatus: "all",
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
    <Card className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Filter Bets</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
          >
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* People Involved Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              People Involved
            </Label>
            <Popover open={peoplePopoverOpen} onOpenChange={setPeoplePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm h-9"
                >
                  <span className="truncate">{getPeopleDisplayText()}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-white dark:bg-gray-950" align="start">
                <div className="p-3 border-b space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllPeople}
                      className="flex-1 h-8 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllPeople}
                      className="flex-1 h-8 text-xs"
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Resolve Status
            </Label>
            <Select value={resolveStatus} onValueChange={(value: ResolveStatus) => setResolveStatus(value)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bets</SelectItem>
                <SelectItem value="active">Active / Unresolved</SelectItem>
                <SelectItem value="resolved">Inactive / Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invested Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Invested Status
            </Label>
            <Select value={investedStatus} onValueChange={(value: InvestedStatus) => setInvestedStatus(value)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bets</SelectItem>
                <SelectItem value="invested">Invested In</SelectItem>
                <SelectItem value="not-invested">Not Invested In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}
