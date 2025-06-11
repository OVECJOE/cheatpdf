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
      toast.error(`Failed to process donation: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Sweden",
    "Norway",
    "Denmark",
    "Australia",
    "New Zealand",
    "Japan",
    "South Korea",
    "Singapore",
    "India",
    "Brazil",
    "Mexico",
    "Argentina",
    "Nigeria",
    "South Africa",
    "Kenya",
    "Egypt",
    "Any Country",
  ];

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Dutch",
    "Swedish",
    "Norwegian",
    "Danish",
    "Japanese",
    "Korean",
    "Chinese",
    "Hindi",
    "Arabic",
    "Russian",
    "Turkish",
    "Any Language",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <div className="flex justify-center">
              <Heart className="w-16 h-16 text-red-500 fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Help Students Study Smarter
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your donation provides pro access to students who can&apos;t
              afford it, giving them the tools they need to succeed
              academically.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-blue-600">
                  {isStatsLoading
                    ? "..."
                    : donationStats.totalStudentsHelped.toLocaleString()}
                </h3>
                <p className="text-gray-600">Students Helped</p>
              </Card>

              <Card className="p-6 text-center">
                <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-600">
                  $
                  {isStatsLoading
                    ? "..."
                    : donationStats.totalDonations.toLocaleString()}
                </h3>
                <p className="text-gray-600">Total Donated</p>
              </Card>

              <Card className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-purple-600">
                  {isStatsLoading ? "..." : donationStats.currentMonthStudents}
                </h3>
                <p className="text-gray-600">Helped This Month</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Real Impact Stories
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;Thanks to CheatPDF Pro, I was able to create practice
                exams from my textbooks. It helped me pass my medical school
                exams with flying colors!&quot;
              </p>
              <div className="text-sm text-gray-500">
                <strong>Maria S.</strong> - Medical Student, Brazil
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The AI-powered exam mode helped me identify my weak areas.
                I improved my grades by 2 letter grades this semester!&quot;
              </p>
              <div className="text-sm text-gray-500">
                <strong>Ahmed K.</strong> - Engineering Student, Egypt
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;Being able to chat with my PDFs in my native language made
                studying so much easier. Thank you to whoever sponsored my
                access!&quot;
              </p>
              <div className="text-sm text-gray-500">
                <strong>Priya M.</strong> - Computer Science Student, India
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="container mx-auto max-w-2xl">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Make a Difference Today
              </h2>
              <p className="text-gray-600">
                Choose how many students you&apos;d like to help and for how
                long
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="donorName">Your Name *</Label>
                  <Input
                    id="donorName"
                    type="text"
                    value={formData.donorName}
                    onChange={(e) =>
                      handleInputChange("donorName", e.target.value)
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="donorEmail">Your Email *</Label>
                  <Input
                    id="donorEmail"
                    type="email"
                    value={formData.donorEmail}
                    onChange={(e) =>
                      handleInputChange("donorEmail", e.target.value)
                    }
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetCountry">
                    Target Country (Optional)
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("targetCountry", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetLanguage">
                    Target Language (Optional)
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("targetLanguage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="studentsToHelp">
                  Number of Students to Help
                </Label>
                <Input
                  id="studentsToHelp"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.studentsToHelp}
                  onChange={(e) =>
                    handleInputChange(
                      "studentsToHelp",
                      parseInt(e.target.value) || 1
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor="donationFrequency">Donation Frequency</Label>
                <Select
                  value={formData.donationFrequency}
                  onValueChange={(value) =>
                    handleInputChange("donationFrequency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">
                      Monthly ($2 per student)
                    </SelectItem>
                    <SelectItem value="QUARTERLY">
                      Quarterly ($4 per student)
                    </SelectItem>
                    <SelectItem value="BIANNUAL">
                      Bi-annually ($6 per student)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Donation Summary */}
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Donation Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Students to help:</span>
                    <span className="font-semibold">
                      {formData.studentsToHelp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-semibold">
                      {getDonationFrequencyText()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target region:</span>
                    <span className="font-semibold">
                      {formData.targetCountry || "Any Country"}
                      {formData.targetLanguage &&
                        ` (${formData.targetLanguage})`}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold text-purple-600">
                    <span>Total donation:</span>
                    <span>${calculateDonationAmount()}</span>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleDonate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg"
              >
                {isLoading
                  ? "Creating Donation..."
                  : `Donate $${calculateDonationAmount()} ${getDonationFrequencyText()}`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You&apos;ll be redirected to Stripe to complete your secure
                donation. Your donation helps provide pro access to students in
                need.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Your Donation Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">You Donate</h3>
              <p className="text-gray-600">
                Choose how many students to help and make your secure donation
                through Stripe
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">We Match Students</h3>
              <p className="text-gray-600">
                We identify students who need help based on your preferences and
                their eligibility
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Students Succeed</h3>
              <p className="text-gray-600">
                Students get pro access and can study more effectively with
                advanced features
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DonationPage;
