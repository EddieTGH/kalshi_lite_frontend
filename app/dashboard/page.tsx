"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BetsTab } from "@/components/BetsTab";
import { LeaderboardTab } from "@/components/LeaderboardTab";
import { CreateBetsTab } from "@/components/CreateBetsTab";
import { ViewBetsTab } from "@/components/ViewBetsTab";
import { PartyHeader } from "@/components/PartyHeader";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, password, currentParty, logout, isLoading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Redirect to party selection if no party selected
  useEffect(() => {
    if (!isLoading && user && !currentParty) {
      router.push("/party-selection");
    }
  }, [user, currentParty, isLoading, router]);

  // Handle party change - refresh all data
  const handlePartyChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Handle bet created/updated - refresh data
  const handleBetChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      router.push("/");
    }
  };

  if (isLoading || !user || !password || !currentParty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-beige">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user is admin of current party
  const isPartyAdmin = currentParty.is_admin;

  return (
    <div className="min-h-screen bg-beige">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header with User Info and Logout */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isPartyAdmin ? "Party Admin" : "Party Member"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Party Header with Dropdown and Details */}
        <div className="mb-6">
          <PartyHeader onPartyChange={handlePartyChange} />
        </div>

        {/* Tabs for Create Bets / View Bets / Leaderboard */}
        <Tabs
          defaultValue={isPartyAdmin ? "create" : "bets"}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
            {isPartyAdmin && (
              <TabsTrigger value="create" className="text-xs sm:text-sm py-2">
                Create Bets
              </TabsTrigger>
            )}
            <TabsTrigger value="bets" className="text-xs sm:text-sm py-2">
              {isPartyAdmin ? "View Bets" : "Bets"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Create Bets Tab (Admin Only) */}
          {isPartyAdmin && (
            <TabsContent value="create">
              <CreateBetsTab
                partyId={currentParty.party_id}
                password={password}
                onBetCreated={handleBetChange}
              />
            </TabsContent>
          )}

          {/* View/Place Bets Tab */}
          <TabsContent value="bets">
            {isPartyAdmin ? (
              <ViewBetsTab
                userId={user.user_id}
                partyId={currentParty.party_id}
                password={password}
                key={refreshKey}
              />
            ) : (
              <BetsTab
                userId={user.user_id}
                partyId={currentParty.party_id}
                password={password}
                key={refreshKey}
              />
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <LeaderboardTab
              partyId={currentParty.party_id}
              password={password}
              key={refreshKey}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
