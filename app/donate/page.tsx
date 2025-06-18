"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import CountryLanguageForm from "@/components/country-language";
import AppHeader from "@/components/app/header";

const DonationPage = () => {
  const [formData, setFormData] = useState({
    donorEmail: "",
    donorName: "",
    targetCountry: "",
    targetLanguage: "",
    studentsToHelp: 1,
    donationFrequency: "MONTHLY",
  });

  const [donationStats, setDonationStats] = useState({
    totalDonations: 0,
    totalStudentsHelped: 0,
    currentMonthDonations: 0,
    currentMonthStudents: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Fetch donation stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/donations/stats");
        if (response.ok) {
          const stats = await response.json();
          setDonationStats(stats);
        }
      } catch (error) {
        console.error("Failed to fetch donation stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateDonationAmount = () => {
    const rates: Record<string, number> = {
      MONTHLY: 2,
      QUARTERLY: 4,
      BIANNUAL: 6,
    };
    return formData.studentsToHelp * rates[formData.donationFrequency];
  };

  const getDonationFrequencyText = () => {
    const texts: Record<string, string> = {
      MONTHLY: "per month",
      QUARTERLY: "every 3 months",
      BIANNUAL: "every 6 months",
    };
    return texts[formData.donationFrequency];
  };

  const handleDonate = async () => {
    if (!formData.donorEmail || !formData.donorName) {
      toast.error("Please fill in your email and name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: calculateDonationAmount(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create donation");
      }
    } catch (error) {
      toast.error(
        `Failed to process donation: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="text-brand-amber border-primary/30 text-xs sm:text-sm"
            >
              <Heart className="inline-block mr-1" />
              Your Donation Matters
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Help Students{" "}
              <span className="gradient-brand bg-clip-text text-transparent">
                Study Smarter
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your donation provides pro access to students who can&apos;t
              afford it, giving them the tools they need to succeed
              academically.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 text-center bg-card border-border transition-all duration-300 hover:shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="text-center mt-4 space-y-1">
                  <h3 className="text-3xl font-bold text-blue-600">
                    {isStatsLoading
                      ? "..."
                      : donationStats.totalStudentsHelped.toLocaleString()}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Students Helped
                  </p>
                </div>
              </Card>

              <Card className="p-6 text-center bg-card border-border transition-all duration-300 hover:shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="text-center mt-4 space-y-1">
                  <h3 className="text-3xl font-bold text-green-600">
                    $
                    {isStatsLoading
                      ? "..."
                      : donationStats.totalDonations.toLocaleString()}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Total Donated
                  </p>
                </div>
              </Card>

              <Card className="p-6 text-center bg-card border-border transition-all duration-300 hover:shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="text-center mt-4 space-y-1">
                  <h3 className="text-3xl font-bold text-purple-600">
                    {isStatsLoading
                      ? "..."
                      : donationStats.currentMonthStudents}
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Helped This Month
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Form Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  Make a Donation
                </h2>
                <p className="text-muted-foreground">
                  Choose how many students you&apos;d like to help and for how long
                </p>
              </div>

              {/* Donor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Your Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="donorName" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="donorName"
                      type="text"
                      placeholder="Your full name"
                      value={formData.donorName}
                      onChange={(e) =>
                        handleInputChange("donorName", e.target.value)
                      }
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donorEmail" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.donorEmail}
                      onChange={(e) =>
                        handleInputChange("donorEmail", e.target.value)
                      }
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Target Demographics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Target Demographics
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose which students you&apos;d like to help (optional)
                </p>
                <CountryLanguageForm
                  onSelectionChange={(field: string, value: string) =>
                    field === "country"
                      ? handleInputChange("targetCountry", value)
                      : handleInputChange("targetLanguage", value)
                  }
                  selectedCountry={formData.targetCountry}
                  selectedLanguage={formData.targetLanguage}
                />
              </div>

              {/* Donation Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Donation Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentsToHelp" className="text-foreground">
                      Number of Students
                    </Label>
                    <Select
                      value={formData.studentsToHelp.toString()}
                      onValueChange={(value) =>
                        handleInputChange("studentsToHelp", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? "student" : "students"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donationFrequency" className="text-foreground">
                      Donation Frequency
                    </Label>
                    <Select
                      value={formData.donationFrequency}
                      onValueChange={(value) =>
                        handleInputChange("donationFrequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="BIANNUAL">Bi-annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Summary and Checkout */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8 bg-card border-border transition-all duration-300 hover:shadow-lg">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  Donation Summary
                </h2>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Students to help:</span>
                  <span className="font-semibold text-foreground">
                    {formData.studentsToHelp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="font-semibold text-foreground">
                    {getDonationFrequencyText()}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-brand-amber">
                      ${calculateDonationAmount()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getDonationFrequencyText()}
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Star className="w-5 h-5 text-brand-amber mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Impact of Your Donation
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your ${calculateDonationAmount()} donation will provide{" "}
                      {formData.studentsToHelp}{" "}
                      {formData.studentsToHelp === 1 ? "student" : "students"} with
                      pro access to AI-powered study tools, helping them excel in
                      their studies.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDonate}
                disabled={isLoading || !formData.donorEmail || !formData.donorName}
                className="w-full h-14 text-lg gradient-brand hover:opacity-90 transition-all duration-300"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Donate ${calculateDonationAmount()} {getDonationFrequencyText()}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Secure payment processed by Stripe. You can cancel or modify your
                donation at any time.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DonationPage;
