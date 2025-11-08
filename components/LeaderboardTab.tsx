"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/lib/types";
import { getAllUsers } from "@/app/api/users";
import { RefreshCw } from "lucide-react";

interface LeaderboardTabProps {
  password: string;
}

export function LeaderboardTab({ password }: LeaderboardTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers(password);
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <Button
          onClick={fetchLeaderboard}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {users.length === 0 && !loading && !error && (
        <Card className="p-8 text-center text-muted-foreground">
          Click refresh to load the leaderboard
        </Card>
      )}

      <div className="space-y-3">
        {users.map((user, index) => (
          <Card key={user.user_id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && (
                    <span className="text-lg font-semibold text-muted-foreground w-8 text-center inline-block">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{user.name}</p>
                    {user.admin && (
                      <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground flex-shrink-0">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: ${user.money.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-primary">
                  ${(user.total_money ?? user.money).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
