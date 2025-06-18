"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Crown } from "lucide-react";
import { SubscriptionStatus } from "@prisma/client";

interface ExamsLayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
}

export default function ExamsLayout({ children }: ExamsLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        // If profile fetch fails, redirect to sign-in
        router.push("/auth/sign-in");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // On error, also redirect to sign-in
      router.push("/auth/sign-in");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication and subscription
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has active subscription
  const isProUser = userProfile?.subscriptionStatus === SubscriptionStatus.ACTIVE;

  if (!isProUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border-border bg-card text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Upgrade Required
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Exam mode is a Pro feature. Upgrade to create practice exams from your documents and test your knowledge.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/dashboard/upgrade")}
              className="w-full gradient-brand hover:opacity-90 transition-all duration-300"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Pro Features Include:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create unlimited practice exams</li>
              <li>• Customizable difficulty levels</li>
              <li>• Detailed performance analytics</li>
              <li>• Time-limited exam modes</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }

  // If user is Pro, render the children
  return <>{children}</>;
}
