"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Crown,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Shield,
  Star,
  Sparkles,
  Loader2,
  Settings,
  Zap,
  Target,
  MessageCircle,
  ClipboardList,
  TrendingUp,
  Infinity,
  ArrowRight,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  subscriptionEnds?: string;
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "",
    originalPrice: 3,
    discountedPrice: 2,
    period: "/month",
    popular: false,
  },
  {
    id: "quarterly",
    name: "Every 3 Months",
    priceId: process.env.NEXT_PUBLIC_STRIPE_QUARTERLY_PRICE_ID || "",
    originalPrice: 6,
    discountedPrice: 4,
    period: "/3 months",
    savings: "Save 33%",
    popular: true,
  },
  {
    id: "biannually",
    name: "Every 6 Months",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BIANNUAL_PRICE_ID || "",
    originalPrice: 12,
    discountedPrice: 6,
    period: "/6 months",
    savings: "Save 50%",
    popular: false,
  },
];

const features = [
  {
    icon: ClipboardList,
    title: "AI-Powered Exams",
    description: "Generate practice exams from your documents with detailed explanations",
    free: false,
    pro: true,
  },
  {
    icon: MessageCircle,
    title: "Unlimited Chats",
    description: "Chat with unlimited documents without restrictions",
    free: "Limited",
    pro: true,
  },
  {
    icon: FileText,
    title: "Document Upload",
    description: "Upload and process PDF documents for AI analysis",
    free: "5 documents",
    pro: "Unlimited",
  },
  {
    icon: TrendingUp,
    title: "Advanced Analytics",
    description: "Track your learning progress and performance insights",
    free: false,
    pro: true,
  },
  {
    icon: Zap,
    title: "Priority Processing",
    description: "Faster document processing and response times",
    free: false,
    pro: true,
  },
  {
    icon: Shield,
    title: "Priority Support",
    description: "Get priority customer support and assistance",
    free: false,
    pro: true,
  },
];

export default function DashboardUpgradePage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>("quarterly");

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

      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

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
    const selectedOption = pricingOptions.find(option => option.id === selectedPlan);
    if (!selectedOption) return;

    setLoading(true);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-checkout",
          priceId: selectedOption.priceId,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/dashboard/upgrade`,
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
      toast.error("Failed to create checkout session. Please try again later.");
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
          returnUrl: `${window.location.origin}/dashboard/upgrade`,
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

  const isProUser = userProfile?.subscriptionStatus === "ACTIVE";

  if (status === "loading" || profileLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {isProUser ? "Manage Your Subscription" : "Upgrade to CheatPDF Pro"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isProUser 
            ? "You're currently on the Pro plan. Manage your subscription or view your benefits below."
            : "Unlock the full potential of CheatPDF with advanced AI features, unlimited documents, and exam mode."
          }
        </p>
      </div>

      {isProUser ? (
        /* Pro User - Subscription Management */
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 border-border bg-card text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're a Pro User! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for supporting CheatPDF. You have access to all premium features.
            </p>
            
            {userProfile?.subscriptionEnds && (
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-secondary">
                  Your subscription renews on {new Date(userProfile.subscriptionEnds).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleManageSubscription}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Manage Subscription
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </Card>

          {/* Pro Features */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Pro Benefits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.filter(feature => feature.pro).map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-secondary/5 rounded-lg">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* Free User - Upgrade Options */
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Pricing Plans */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Select the perfect plan for your learning needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingOptions.map((option) => (
                <Card
                  key={option.id}
                  className={`p-6 border-border bg-card cursor-pointer transition-all duration-200 ${
                    selectedPlan === option.id
                      ? "border-primary shadow-lg scale-105"
                      : "hover:border-primary/50 hover:shadow-md"
                  } ${option.popular ? "ring-2 ring-primary/20" : ""}`}
                  onClick={() => setSelectedPlan(option.id)}
                >
                  {option.popular && (
                    <div className="text-center mb-4">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{option.name}</h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-bold text-foreground">${option.discountedPrice}</span>
                        <span className="text-sm text-muted-foreground line-through">${option.originalPrice}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{option.period}</span>
                    </div>
                    
                    {option.savings && (
                      <div className="mb-4">
                        <Badge variant="secondary" className="text-xs">
                          {option.savings}
                        </Badge>
                      </div>
                    )}
                    
                    <div className={`w-6 h-6 rounded-full border-2 mx-auto ${
                      selectedPlan === option.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {selectedPlan === option.id && (
                        <CheckCircle className="w-4 h-4 text-primary-foreground m-0.5" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Cancel anytime • Secure payment via Stripe
              </p>
            </div>
          </div>

          {/* Feature Comparison */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Feature Comparison
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-foreground">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center justify-center">
                        <Crown className="w-4 h-4 mr-1 text-primary" />
                        Pro
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <feature.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.free === true ? (
                          <CheckCircle className="w-5 h-5 text-secondary mx-auto" />
                        ) : feature.free === false ? (
                          <X className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.pro === true ? (
                          <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-border bg-card text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">10,000+ Students</h3>
              <p className="text-sm text-muted-foreground">
                Join thousands of students already using CheatPDF to accelerate their learning.
              </p>
            </Card>

            <Card className="p-6 border-border bg-card text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Save 10+ Hours/Week</h3>
              <p className="text-sm text-muted-foreground">
                Get instant answers instead of spending hours searching through documents.
              </p>
            </Card>

            <Card className="p-6 border-border bg-card text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">95% Success Rate</h3>
              <p className="text-sm text-muted-foreground">
                Students report better grades and understanding with CheatPDF Pro.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 