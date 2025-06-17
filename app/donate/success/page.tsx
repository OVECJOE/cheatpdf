"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const getDonationFrequencyText = (frequency: string) => {
    const texts: Record<string, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Every 3 months",
      BIANNUAL: "Every 6 months",
    };
    return texts[frequency] || frequency;
  };

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
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card className="p-8 text-center bg-card border-border transition-all duration-300 hover:shadow-lg">
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
                className="gradient-brand text-white hover:opacity-90 transition-all duration-300"
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
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Success Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <Badge
              variant="outline"
              className="text-green-600 border-green-600 text-sm"
            >
              <Heart className="inline-block mr-1 w-4 h-4" />
              Donation Successful
            </Badge>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Thank You for Your{" "}
              <span className="gradient-brand bg-clip-text text-transparent">
                Generosity!
              </span>
            </h1>

            <p className="text-lg text-muted-foreground">
              Your donation of <strong className="text-brand-amber">${donation.amount}</strong> will help{" "}
              <strong className="text-brand-amber">
                {studentsCount} student{studentsCount !== 1 ? "s" : ""}
              </strong>{" "}
              access premium study tools and succeed academically.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Summary */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-xl">
          <Card className="p-6 bg-primary/5 border-primary/20 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center text-foreground">
              Donation Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Amount</span>
                </div>
                <span className="font-semibold text-foreground">${donation.amount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Students Helped</span>
                </div>
                <span className="font-semibold text-foreground">{studentsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Frequency</span>
                </div>
                <span className="font-semibold text-foreground">
                  {getDonationFrequencyText(donation.metadata.donationFrequency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Target Region</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{targetCountry}</div>
                  {targetLanguage !== "Any Language" && (
                    <div className="text-sm text-muted-foreground">
                      {targetLanguage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-6 bg-card border-border transition-all duration-300 hover:shadow-lg">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">Your Impact</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-muted-foreground">
                    You've helped {studentsCount} student{studentsCount !== 1 ? "s" : ""} access AI study tools
                  </span>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Your donation will provide full access to premium features like 
                    unlimited document chats, exam generation, and personalized study plans.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleShare}
              className="flex items-center gap-2 gradient-brand text-white hover:opacity-90 transition-all duration-300"
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
