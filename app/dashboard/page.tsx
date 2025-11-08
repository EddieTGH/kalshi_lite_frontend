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
import { LogOut } from "lucide-react";
import { getUserById } from "@/app/api/users";

export default function DashboardPage() {
  const { user, password, logout, isLoading } = useAuth();
  const router = useRouter();
  const [currentMoney, setCurrentMoney] = useState(user?.money || 0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const refreshUserMoney = async () => {
      if (user && password) {
        try {
          const userData = await getUserById(user.user_id, password);
          setCurrentMoney(userData.money);
        } catch (err) {
          console.error("Failed to refresh user money", err);
        }
      }
    };

    refreshUserMoney();
  }, [user, password, refreshKey]);

  const handleBetChange = () => {
    // Trigger a refresh of user money
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      router.push("/");
    }
  };

  if (isLoading || !user || !password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-beige">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {user.name}
            </h1>
            {user.admin && (
              <p className="text-sm text-muted-foreground mt-1">Admin Account</p>
            )}
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

        <Tabs defaultValue={user.admin ? "create" : "bets"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
            {user.admin && (
              <TabsTrigger value="create" className="text-xs sm:text-sm py-2">
                Create Bets
              </TabsTrigger>
            )}
            <TabsTrigger value="bets" className="text-xs sm:text-sm py-2">
              {user.admin ? "View Bets" : "Bets"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm py-2">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {user.admin && (
            <TabsContent value="create">
              <CreateBetsTab password={password} onBetCreated={handleBetChange} />
            </TabsContent>
          )}

          <TabsContent value="bets">
            {user.admin ? (
              <ViewBetsTab
                userId={user.user_id}
                password={password}
                userMoney={currentMoney}
                key={refreshKey}
              />
            ) : (
              <BetsTab
                userId={user.user_id}
                password={password}
                userMoney={currentMoney}
                key={refreshKey}
              />
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab password={password} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
