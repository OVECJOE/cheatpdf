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
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <AppHeader />
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Donation
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "We couldn't find your donation details."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push("/donate")}>
                Make Another Donation
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
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

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Thank You for Your{" "}
              <span className="bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                Generosity!
              </span>
            </h1>

            <p className="text-lg text-gray-600">
              Your donation of <strong>${donation.amount}</strong> will help{" "}
              <strong>
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
          <Card className="p-6 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold mb-4 text-center">
              Donation Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Amount</span>
                </div>
                <span className="font-semibold">${donation.amount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Students Helped</span>
                </div>
                <span className="font-semibold">{studentsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Frequency</span>
                </div>
                <span className="font-semibold">
                  {getDonationFrequencyText(
                    donation.metadata.donationFrequency
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Target Region</span>
                </div>
                <span className="font-semibold">{targetCountry}</span>
              </div>

              {targetLanguage !== "Any Language" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Language</span>
                  </div>
                  <span className="font-semibold">{targetLanguage}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Share Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Share Your Impact</h2>
          <p className="text-gray-600 mb-6">
            Help us reach more donors by sharing your good deed on social media!
          </p>

          <Button
            onClick={handleShare}
            size="lg"
            className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Your Donation
          </Button>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-4">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Immediate Impact</h3>
              <p className="text-sm text-gray-600">
                Students matching your criteria will receive instant pro access
              </p>
            </Card>

            <Card className="p-4">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Ongoing Support</h3>
              <p className="text-sm text-gray-600">
                Your{" "}
                {getDonationFrequencyText(
                  donation.metadata.donationFrequency
                ).toLowerCase()}{" "}
                donation continues helping students
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              We&apos;ll send updates about the impact of your donation to{" "}
              <span className="font-medium">{donation.donorEmail}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Return to CheatPDF</Button>
              </Link>
              <Link href="/donate">
                <Button className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Help More Students
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const DonationLoading = () => (
  <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
    <AppHeader />
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your donation details...</p>
      </Card>
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
