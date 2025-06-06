"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Crown, CheckCircle, ArrowLeft, Clock, FileText,
  Users, Shield, Star, Sparkles
} from "lucide-react";

export default function UpgradePage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);

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
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error("Failed to create checkout session");
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isPro = userProfile?.subscription?.status === "active";

  if (isPro) {
    return (
      <div className="min-h-screen bg-gray-50">
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

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">You&apos;re Already Pro!</h2>
            <p className="text-gray-600 mb-6">
              You have access to all CheatPDF Pro features. Continue enjoying unlimited documents, exam mode, and more.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CheatPDF Pro</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-lg px-4 py-2">
              Limited Time: 50% Off First Month
            </Badge>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Unlock Your Full
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Study Potential</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get unlimited access to all CheatPDF features for just $5/month. 
            Generate practice exams, upload unlimited documents, and study smarter with AI.
          </p>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
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

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="p-8 border-2 border-blue-600 shadow-xl relative">
            <Badge className="absolute -top-3 left-4 bg-blue-600 text-lg px-4 py-1">
              Most Popular
            </Badge>
            
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">CheatPDF Pro</h3>
                <p className="text-gray-600">Everything you need to excel</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl text-gray-400 line-through">$10</span>
                  <span className="text-5xl font-bold text-gray-900">$5</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-green-600 font-medium">50% off for first month</p>
              </div>

              <Button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            What&apos;s Included in Pro
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Features */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Free Plan</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Chat with PDFs (unlimited)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Upload up to 3 documents</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Basic summarization</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Multi-language support</span>
                </li>
              </ul>
            </Card>

            {/* Pro Features */}
            <Card className="p-6 border-2 border-blue-600 bg-blue-50">
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Everything in Free</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Unlimited document uploads</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Exam Mode with detailed explanations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Sourcer Mode (for professionals)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Advanced AI features</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Priority support</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pro Features That Make a Difference
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Timed Practice Exams</h3>
              <p className="text-gray-600">
                Generate realistic practice exams from your documents. Get detailed explanations for wrong answers after completion.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Unlimited Documents</h3>
              <p className="text-gray-600">
                Upload as many study materials as you need. No limits on the number of PDFs you can process and chat with.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sourcer Mode</h3>
              <p className="text-gray-600">
                For professionals: analyze candidate profiles and create AI-powered sourcing strategies to find top talent.
              </p>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Students Say About Pro
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                &quot;The exam mode is a game changer! I went from failing practice tests to acing my finals. 
                The AI explanations helped me understand concepts I struggled with for months.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">SM</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sarah M.</p>
                  <p className="text-sm text-gray-600">Pre-Med Student</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                &quot;Being able to upload all my textbooks and lecture notes is incredible. 
                CheatPDF Pro has become my personal AI tutor that&apos;s available 24/7.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">JD</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">James D.</p>
                  <p className="text-sm text-gray-600">Engineering Student</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have Pro access until the end of your billing period.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How does the 50% discount work?</h3>
              <p className="text-gray-600">
                New Pro subscribers get 50% off their first month. After that, the subscription continues at the regular $5/month price.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards and debit cards through our secure payment processor, Stripe.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Absolutely. Your documents and data are encrypted and stored securely. We never share your information with third parties.
              </p>
            </Card>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Supercharge Your Studies?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of students who are studying smarter with CheatPDF Pro
            </p>
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-6 text-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-6 h-6 mr-2" />
                  Start Your Pro Journey - $2.50/mo
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              50% off first month • Then $5/month • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}