"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionStatus } from "@prisma/client";

interface ExamLayoutProps {
  children: React.ReactNode;
}

type UserProfile = {
  id: string;
  name: string;
  email: string;
  country: string;
  language?: string;
  userType: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  isEmailVerified: boolean;
};

export default function ExamLayout({ children }: ExamLayoutProps) {
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
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const profileData = await response.json();
      setUserProfile(profileData);
    } catch (error) {
      toast.error(
        `Failed to fetch profile data: ${error instanceof Error ? error.message : error}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const isPro = userProfile?.subscriptionStatus === SubscriptionStatus.ACTIVE;

  if (!isPro) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Premium Feature
            </h2>
            <p className="text-gray-600 mb-6">
              Exam Mode is available with CheatPDF Pro. Generate practice exams,
              get detailed explanations, and track your progress.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => router.push("/upgrade")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - $5/month
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Continue with Free Features
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
