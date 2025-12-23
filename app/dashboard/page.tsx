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
import { BetsCacheProvider } from "@/lib/bets-cache-context";
import { LogOut, User, Search, Trophy, PlusCircle } from "lucide-react";

export default function DashboardPage() {
  const { user, password, currentParty, logout, isLoading } = useAuth();
  const router = useRouter();
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
    // Party change will trigger cache refresh automatically
  };

  // Handle bet created - refresh and return to your bets
  const handleBetCreated = async () => {
    setCurrentTab("your-bets");
  };

  // Handle navigate to browse bets
  const handleNavigateToBrowse = () => {
    setCurrentTab("browse-bets");
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  // Check if user is admin of current party
  const isPartyAdmin = currentParty.is_admin;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header with User Info and Logout */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl text-primary font-bold text-foreground truncate">
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
            className="gap-2 flex-shrink-0 border-gray-500"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Party Header with Dropdown and Details - Only show on Your Bets tab */}
        {currentTab === "your-bets" && (
          <div className="mb-6">
            <PartyHeader onPartyChange={handlePartyChange} />
          </div>
        )}

        {/*
          BETS CACHE PROVIDER
          Wraps the tabs to provide shared caching for all tabs (Your Bets, Browse Bets, Leaderboard)
          - Shows cached data immediately when switching tabs (no loading spinner)
          - Refreshes all data silently in background every 30 seconds
          - See /lib/bets-cache-context.tsx and /docs/caching-strategy.md for details
        */}
        <BetsCacheProvider
          userId={user.user_id}
          partyId={currentParty.party_id}
          password={password}
        >
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
              />
            </TabsContent>

            {/* Browse Bets Tab */}
            <TabsContent value="browse-bets">
              {isPartyAdmin ? (
                <ViewBetsTab
                  userId={user.user_id}
                  partyId={currentParty.party_id}
                  password={password}
                />
              ) : (
                <BetsTab
                  userId={user.user_id}
                  partyId={currentParty.party_id}
                  password={password}
                />
              )}
            </TabsContent>

            {/* Create Bet Tab */}
            <TabsContent value="create-bet">
              <CreateBetsTab
                partyId={currentParty.party_id}
                password={password}
                onBetCreated={handleBetCreated}
              />
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <LeaderboardTab />
            </TabsContent>

            {/* Bottom Navigation Bar */}
            <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-4 h-20 rounded-t-3xl border-t bg-card shadow-2xl px-2 gap-0 [&>*]:border-0">
              <TabsTrigger
                value="your-bets"
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all border-0 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground"
              >
                <User className="h-5 w-5" />
                <span className="text-xs font-medium">Your Bets</span>
              </TabsTrigger>
              <TabsTrigger
                value="browse-bets"
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all border-0 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground"
              >
                <Search className="h-5 w-5" />
                <span className="text-xs font-medium">Browse Bets</span>
              </TabsTrigger>
              <TabsTrigger
                value="create-bet"
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all border-0 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground"
              >
                <PlusCircle className="h-5 w-5" />
                <span className="text-xs font-medium">
                  {isPartyAdmin ? "Create Bet" : "Suggest Bet"}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all border-0 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:text-muted-foreground"
              >
                <Trophy className="h-5 w-5" />
                <span className="text-xs font-medium">Leaderboard</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </BetsCacheProvider>
      </div>
    </div>
  );
}
