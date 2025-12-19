"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BetsTab } from "@/components/BetsTab";
import { LeaderboardTab } from "@/components/LeaderboardTab";
import { ViewBetsTab } from "@/components/ViewBetsTab";
import { YourBetsTab } from "@/components/YourBetsTab";
import { CreateBetsTab } from "@/components/CreateBetsTab";
import { PartyHeader } from "@/components/PartyHeader";
import { LogOut, ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  const { user, password, currentParty, logout, isLoading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateBet, setShowCreateBet] = useState(false);
  const [currentTab, setCurrentTab] = useState("your-bets");

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

  // Handle bet created - refresh and return to your bets
  const handleBetCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setShowCreateBet(false);
    setCurrentTab("your-bets");
  };

  // Handle navigate to browse bets
  const handleNavigateToBrowse = () => {
    setCurrentTab("browse-bets");
  };

  // Handle navigate to create bet
  const handleNavigateToCreate = () => {
    setShowCreateBet(true);
  };

  // Handle back from create bet
  const handleBackFromCreate = () => {
    setShowCreateBet(false);
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

  // If showing Create Bet form
  if (showCreateBet) {
    return (
      <div className="min-h-screen bg-beige pb-20">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBackFromCreate}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Create Bet Form */}
          <CreateBetsTab
            partyId={currentParty.party_id}
            password={password}
            onBetCreated={handleBetCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige pb-20">
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

        {/* Tabs for Your Bets / Browse Bets / Leaderboard */}
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="space-y-4"
        >
          {/* Tab Content */}
          {/* Your Bets Tab (New) */}
          <TabsContent value="your-bets">
            <YourBetsTab
              userId={user.user_id}
              partyId={currentParty.party_id}
              password={password}
              isAdmin={isPartyAdmin}
              onNavigateToBrowse={handleNavigateToBrowse}
              onNavigateToCreate={handleNavigateToCreate}
              key={refreshKey}
            />
          </TabsContent>

          {/* Browse Bets Tab */}
          <TabsContent value="browse-bets">
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

          {/* Bottom Navigation Bar */}
          <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-3 h-16 rounded-none border-t bg-white shadow-lg">
            <TabsTrigger
              value="your-bets"
              className="text-xs py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold"
            >
              Your Bets
            </TabsTrigger>
            <TabsTrigger
              value="browse-bets"
              className="text-xs py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold"
            >
              Browse Bets
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="text-xs py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:font-semibold"
            >
              Leaderboard
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
