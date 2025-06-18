"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Heart,
  Users,
  Share2,
  Calendar,
  DollarSign,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import AppHeader from "@/components/app/header";
import Link from "next/link";

interface SessionMetadata {
  donationId: string;
  studentsToHelp: string;
  donationFrequency: string;
  targetCountry: string;
  targetLanguage: string;
}

interface DonationData {
  amount: number;
  donorEmail: string;
  metadata: SessionMetadata;
}

const DonationSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [donation, setDonation] = useState<DonationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        return;
      }

      try {
        const response = await fetch(`/api/stripe/session/${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch session details");
        }

        const sessionData = await response.json();
        setDonation({
          amount: sessionData.amount_total / 100, // Convert from cents
          donorEmail: sessionData.customer_email,
          metadata: sessionData.metadata as SessionMetadata,
        });
      } catch {
        setError("Failed to load donation details");
        toast.error("Failed to load donation details");
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleShare = async () => {
    const studentsCount = donation?.metadata.studentsToHelp || "1";
    const amount = donation?.amount || "0";

    const shareText = `I just donated $${amount} to help ${studentsCount} student${studentsCount !== "1" ? "s" : ""} access premium study tools on CheatPDF! 🎓💜 Join me in making education accessible for everyone.`;
    const shareUrl = `${window.location.origin}/donate`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "I helped students on CheatPDF!",
          text: shareText,
          url: shareUrl,
        });
        toast.success("Thanks for sharing!");
      } catch {
        toast.error("Cancelled sharing. Please copy the text instead.");
      }
    } else {
      // Fallback - copy to clipboard
      const fullText = `${shareText}\n\n${shareUrl}`;
      await navigator.clipboard.writeText(fullText);
      toast.success("Share text copied to clipboard!");
    }
  };

  if (error || !donation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-surface-secondary to-surface-tertiary">
        <AppHeader />
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Unable to Load Donation
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't find your donation details."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push("/donate")}
                className="gradient-brand hover:opacity-90 transition-all duration-300"
              >
                Make Another Donation
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const studentsCount = parseInt(donation.metadata.studentsToHelp);
  const targetCountry = donation.metadata.targetCountry || "Any Country";
  const targetLanguage = donation.metadata.targetLanguage || "Any Language";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-surface-secondary to-surface-tertiary">
      <AppHeader />

      {/* Success Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Thank You for Your{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Generous Donation!
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Your contribution will make a real difference in students&apos; lives.
              Here&apos;s what your donation will accomplish:
            </p>
          </div>
        </div>
      </section>

      {/* Impact Summary */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your Impact
                  </h2>
                  <p className="text-muted-foreground">
                    Here&apos;s what your donation will provide:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Students Helped</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {studentsCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-secondary" />
                      <span className="text-foreground font-medium">Donation Amount</span>
                    </div>
                    <span className="text-2xl font-bold text-secondary">
                      ${donation.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Frequency</span>
                    </div>
                    <span className="text-lg font-semibold text-foreground">
                      {donation.metadata.donationFrequency === "MONTHLY" && "Monthly"}
                      {donation.metadata.donationFrequency === "QUARTERLY" && "Quarterly"}
                      {donation.metadata.donationFrequency === "BIANNUAL" && "Bi-annual"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-8 border-border bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Target Demographics
                  </h2>
                  <p className="text-muted-foreground">
                    Your donation will help students in:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-secondary/5 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="w-5 h-5 text-secondary" />
                      <span className="text-foreground font-medium">Target Country</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary">
                      {targetCountry}
                    </p>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Target Language</span>
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      {targetLanguage}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-foreground font-medium">Donor Information</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Email:</strong> {donation.donorEmail}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-12 sm:py-16 lg:py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleShare}
              className="flex items-center gap-2 gradient-brand hover:opacity-90 transition-all duration-300"
            >
              <Share2 className="w-4 h-4" />
              Share Your Impact
            </Button>

            <Link href="/donate">
              <Button 
                variant="outline"
                className="w-full sm:w-auto border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                Donate Again
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button 
                variant="outline"
                className="w-full sm:w-auto border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Message */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to{" "}
            <span className="font-medium text-foreground">{donation.donorEmail}</span>.
            You can manage your donations anytime from your email.
          </p>
        </div>
      </section>
    </div>
  );
};

// Loading component for Suspense
const DonationLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
      <p className="text-muted-foreground">Loading donation details...</p>
    </div>
  </div>
);

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={<DonationLoading />}>
      <DonationSuccess />
    </Suspense>
  );
}
