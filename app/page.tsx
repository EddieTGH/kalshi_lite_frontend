"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { login as loginApi, register as registerApi } from "./api/users";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCodeDisplay, setShowCodeDisplay] = useState(false);
  const [copied, setCopied] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to party-selection page instead of dashboard
      router.push("/party-selection");
    }
  }, [user, isLoading, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
      router.push("/party-selection");
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (fullName.length > 100) {
      setError("Name must be 100 characters or less");
      return;
    }

    setLoading(true);

    try {
      const response = await registerApi({ name: fullName.trim() });
      setGeneratedCode(response.password);
      setShowCodeDisplay(true);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || "This name is already taken");
      } else {
        setError(
          err.response?.data?.message || "An error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSavedCode = async () => {
    // Log the user in with the generated code
    try {
      const userData = await loginApi({ password: generatedCode });
      login(userData, generatedCode);
      router.push("/party-selection");
    } catch {
      setError("Failed to log in. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  // Show code display after successful registration
  if (showCodeDisplay) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Welcome to Kalshi Lite!
            </CardTitle>
            <CardDescription className="text-base">
              Your account has been created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-center font-medium text-lg">
                This is your password. Save it somewhere safe!
              </p>
              <div className="flex items-center justify-center gap-2 bg-muted p-6 rounded-lg">
                <span className="text-4xl font-mono font-bold tracking-widest">
                  {generatedCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="ml-2"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You&apos;ll need this code to log in. Keep it safe!
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              onClick={handleSavedCode}
              className="w-full bg-primary hover:bg-primary/90"
            >
              I&apos;ve Saved It
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Kalshi Lite
          </CardTitle>
          <CardDescription className="text-base">
            Login or create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
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
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                    autoComplete="off"
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || !fullName.trim()}
                >
                  {loading ? "Creating Account..." : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
