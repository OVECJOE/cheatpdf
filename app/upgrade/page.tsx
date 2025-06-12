"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Crown,
  CheckCircle,
  ArrowLeft,
  Clock,
  FileText,
  Users,
  Shield,
  Star,
  Sparkles,
  Loader2,
  Settings,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  userType: string;
}

interface SubscriptionStatus {
  status: string;
  plan?: string;
  currentPeriodEnd?: string;
}

type PricingPlan = "monthly" | "quarterly" | "biannually";

interface PricingOption {
  id: PricingPlan;
  name: string;
  priceId: string;
  originalPrice: number;
  discountedPrice: number;
  period: string;
  savings?: string;
  popular?: boolean;
}

const pricingOptions: PricingOption[] = [
  {
    id: "monthly",
    name: "Monthly",
    priceId: process.env.NEXT_STRIPE_MONTHLY_PRICE_ID,
    originalPrice: 3,
    discountedPrice: 2,
    period: "/month",
    popular: false,
  },
  {
    id: "quarterly",
    name: "Every 3 Months",
    priceId: process.env.NEXT_STRIPE_QUARTERLY_PRICE_ID,
    originalPrice: 6,
    discountedPrice: 4,
    period: "/3 months",
    savings: "Save 33%",
    popular: true,
  },
  {
    id: "biannually",
    name: "Every 6 Months",
    priceId: process.env.NEXT_STRIPE_BIANNUAL_PRICE_ID,
    originalPrice: 12,
    discountedPrice: 6,
    period: "/6 months",
    savings: "Save 50%",
    popular: false,
  },
];

export default function UpgradePage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("monthly");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      setProfileLoading(true);

      // Fetch user profile
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch subscription status
      const subscriptionResponse = await fetch("/api/subscription");
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscriptionStatus(subscriptionData.status);
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to load user data");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const selectedOption = pricingOptions.find(
      (option) => option.id === selectedPlan
    );
    if (!selectedOption) return;

    setLoading(true);

    try {
      console.log(JSON.stringify({
          action: "create-checkout",
          priceId: selectedOption.priceId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/upgrade`,
        }));
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-checkout",
          priceId: selectedOption.priceId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/upgrade`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No checkout URL received");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error(
        "Failed to create checkout session. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-portal",
          returnUrl: `${window.location.origin}/upgrade`,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No portal URL received");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || profileLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          <span className="text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  const isPro =
    subscriptionStatus?.status === "active" ||
    userProfile?.subscriptionStatus === "active";
  const currentOption = pricingOptions.find(
    (option) => option.id === selectedPlan
  )!;

  if (isPro) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-white border-b border-amber-200">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              You&apos;re Already Pro!
            </h2>
            <p className="text-gray-600 mb-8 text-sm sm:text-base">
              You have access to all CheatPDF Pro features. Continue enjoying
              unlimited documents, exam mode, and more.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                CheatPDF
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
            <Badge className="bg-gradient-to-r from-amber-400 to-purple-500 text-white text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2">
              Limited Time: Up to 33% Off
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Unlock Your Full
            <span className="bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Study Potential
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Get unlimited access to all CheatPDF features with flexible billing
            options. Generate practice exams, upload unlimited documents, and
            study smarter with AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" />
              <span>Used by 10,000+ students</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Instant access</span>
            </div>
          </div>
        </div>

        {/* Pricing Card with Tabs */}
        <div className="max-w-lg mx-auto mb-12 sm:mb-16">
          <Card className="p-6 sm:p-8 border-2 border-amber-500 shadow-xl relative bg-white">
            {currentOption.popular && (
              <Badge className="absolute -top-3 left-4 bg-amber-500 text-white text-sm sm:text-lg px-3 py-1 sm:px-4">
                Most Popular
              </Badge>
            )}

            {/* Pricing Tabs */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {pricingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedPlan(option.id)}
                    className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      selectedPlan === option.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div>{option.name}</div>
                    {option.savings && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {option.savings}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  CheatPDF Pro
                </h3>
                <p className="text-gray-600">Everything you need to excel</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl sm:text-2xl text-gray-400 line-through">
                    ${Math.round(currentOption.originalPrice)}
                  </span>
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                    ${currentOption.discountedPrice}
                  </span>
                  <span className="text-gray-600">{currentOption.period}</span>
                </div>
                {currentOption.savings && (
                  <p className="text-sm text-green-600 font-medium">
                    {currentOption.savings}
                  </p>
                )}
                {selectedPlan === "monthly" && (
                  <p className="text-sm text-green-600 font-medium">
                    50% off for first month
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 py-4 sm:py-6 text-base sm:text-lg font-semibold text-white shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Pro Now
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                Secure payment powered by Stripe • Cancel anytime
              </p>
            </div>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            What&apos;s Included in Pro
          </h2>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Free Features */}
            <Card className="p-4 sm:p-6 bg-white">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Free Plan
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Chat with PDFs (unlimited)
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Upload up to 5 documents
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Basic summarization
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm sm:text-base">
                    Multi-language support
                  </span>
                </li>
              </ul>
            </Card>

            {/* Pro Features */}
            <Card className="p-4 sm:p-6 border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-purple-50">
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Pro Plan
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Everything in Free
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Unlimited document uploads
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Exam Mode with detailed explanations
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Sourcer Mode (for professionals)
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Advanced AI features
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">
                    Priority support
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Pro Features That Make a Difference
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-4 sm:p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Timed Practice Exams
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Generate realistic practice exams from your documents. Get
                detailed explanations for wrong answers after completion.
              </p>
            </Card>

            <Card className="p-4 sm:p-6 text-center bg-white hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Unlimited Documents
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Upload as many study materials as you need. No limits on the
                number of PDFs you can process and chat with.
              </p>
            </Card>

            <Card className="p-4 sm:p-6 text-center bg-white hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Sourcer Mode
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                For professionals: analyze candidate profiles and create
                AI-powered sourcing strategies to find top talent.
              </p>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            What Students Say About CheatPDF
          </h2>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="p-4 sm:p-6 bg-white">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-amber-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                &quot;The exam mode is a game changer! I went from failing
                practice tests to acing my finals. The AI explanations helped me
                understand concepts I struggled with for months.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">SM</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Sarah M.</p>
                  <p className="text-xs text-gray-600">Pre-Med Student</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-white">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-amber-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                &quot;Being able to upload all my textbooks and lecture notes is
                incredible. CheatPDF has become my personal AI tutor that&apos;s
                available 24/7.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">JD</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">James D.</p>
                  <p className="text-xs text-gray-600">Engineering Student</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 bg-white">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Yes! You can cancel your subscription at any time. You&apos;ll
                continue to have Pro access until the end of your billing
                period.
              </p>
            </Card>

            <Card className="p-4 sm:p-6 bg-white">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                How do the different billing options work?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Choose monthly for flexibility, quarterly to save 20%, or
                bi-annually to save 33%. All plans include the same Pro features
                with different billing frequencies.
              </p>
            </Card>

            <Card className="p-4 sm:p-6 bg-white">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                We accept all major credit cards and debit cards through our
                secure payment processor, Stripe.
              </p>
            </Card>

            <Card className="p-4 sm:p-6 bg-white">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                Is my data secure?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Absolutely. Your documents and data are encrypted and stored
                securely. We never share your information with third parties.
              </p>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Ready to Supercharge Your Studies?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Join thousands of students who are studying smarter with CheatPDF
            </p>
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold text-white shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Your Pro Journey @ ${currentOption.discountedPrice}
                  {currentOption.period}
                </>
              )}
            </Button>
            <p className="text-xs sm:text-sm text-gray-500 mt-4">
              {currentOption.savings && `${currentOption.savings} • `}Cancel
              anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
