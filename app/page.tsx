"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { login as loginApi } from "./api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password format
    if (!/^[A-Z0-9]{3}$/.test(password)) {
      setError(
        "Password must be 3 uppercase alphanumeric characters (A-Z, 0-9)"
      );
      return;
    }

    setLoading(true);

    try {
      const userData = await loginApi({ password });
      login(userData, password);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Invalid password");
      } else {
        setError(
          err.response?.data?.message || "An error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-beige">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-beige px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Kalshi Lite
          </CardTitle>
          <CardDescription className="text-base">
            Enter your password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                placeholder="ABC"
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                maxLength={3}
                className="text-center text-xl font-mono tracking-widest"
                autoComplete="off"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading || password.length !== 3}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
