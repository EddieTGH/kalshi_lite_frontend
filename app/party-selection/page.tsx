"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserParties, getPartyMembers } from "@/app/api/parties";
import { PartyWithMembership } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Plus, LogIn, LogOut } from "lucide-react";
import { CreatePartyModal } from "@/components/CreatePartyModal";
import { JoinPartyModal } from "@/components/JoinPartyModal";

export default function PartySelectionPage() {
  const { user, password, setCurrentParty, logout, isLoading } = useAuth();
  const router = useRouter();
  const [parties, setParties] = useState<PartyWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Fetch user's parties
  useEffect(() => {
    const fetchParties = async () => {
      if (!user || !password) return;

      try {
        setLoading(true);
        const userParties = await getUserParties(password);
        setParties(userParties);
      } catch (err: any) {
        console.error("Failed to fetch parties:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load parties. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [user, password]);

  // Handle party selection
  const handleSelectParty = (party: PartyWithMembership) => {
    setCurrentParty(party);
    router.push("/dashboard");
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      router.push("/");
    }
  };

  // Handle party created
  const handlePartyCreated = (party: PartyWithMembership) => {
    // Add new party to list
    setParties([party, ...parties]);
    setShowCreateModal(false);
  };

  // Handle party joined
  const handlePartyJoined = (party: PartyWithMembership) => {
    // Add joined party to list
    setParties([party, ...parties]);
    setShowJoinModal(false);
  };

  if (isLoading || !user || !password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl text-primary font-bold text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a party or create a new one
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 border-gray-500"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
            disabled={user.remaining_hosts <= 0}
          >
            <Plus className="h-4 w-4" />
            Create Party{" "}
            {user.remaining_hosts > 0 && `(${user.remaining_hosts} remaining)`}
          </Button>
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="outline"
            className="gap-2 border-gray-500"
          >
            <LogIn className="h-4 w-4" />
            Join Party
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading parties...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && parties.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parties yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new party or join an existing one to get started
              </p>
            </CardContent>
          </Card>
        )}

        {/* Parties List */}
        {!loading && parties.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {parties.map((party) => (
              <Card
                key={party.party_id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectParty(party)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{party.name}</CardTitle>
                    {party.is_admin && (
                      <Badge variant="default" className="shrink-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                  {party.description && (
                    <CardDescription className="line-clamp-2">
                      {party.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(party.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{party.member_count} members</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="font-mono">
                        {party.join_code}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Party Modal */}
      <CreatePartyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPartyCreated={handlePartyCreated}
      />

      {/* Join Party Modal */}
      <JoinPartyModal
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        onPartyJoined={handlePartyJoined}
      />
    </div>
  );
}
