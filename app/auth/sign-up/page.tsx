"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, User, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import CountryLanguageForm from "@/components/country-language";

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1: basic info, 2: magic link sent
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    country: "",
    language: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    setLoading(true);

    try {
      // First create the user record
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Then send magic link
        await signIn("email", {
          email: formData.email,
          callbackUrl: "/onboarding",
          redirect: false,
        });
        setStep(2);
      } else {
        const error = await response.json();
        console.error("Registration error:", error);
        alert(error.message || "Registration failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    try {
      await signIn("email", {
        email: formData.email,
        callbackUrl: "/onboarding",
        redirect: false,
      });
    } catch (error) {
      console.error("Resend error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="p-6 bg-card border-border transition-all duration-300 hover:shadow-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
        </div>
        <CountryLanguageForm
          onSelectionChange={handleInputChange}
          selectedCountry={formData.country}
          selectedLanguage={formData.language}
        />
        <div className="inline-block space-x-2">
          <input id="terms" type="checkbox" className="rounded accent-primary" required />
          <Label htmlFor="terms" className="text-sm text-muted-foreground inline leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-brand-amber hover:text-primary/80 underline transition-colors duration-200">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand-amber hover:text-primary/80 underline transition-colors duration-200">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button
          onClick={handleSignUp}
          className="w-full h-12 gradient-brand text-white hover:opacity-90 transition-all duration-300"
          disabled={!formData.name.trim() || !formData.email.trim() || loading}
        >
          {loading ? (
            "Creating account..."
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Create account & send link
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6 bg-card border-border transition-all duration-300 hover:shadow-lg">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Check your email!
          </h2>
          <p className="text-muted-foreground">
            We&apos;ve sent a secure sign-in link to:
          </p>
          <p className="font-medium text-foreground">{formData.email}</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left">
          <h3 className="font-medium text-foreground mb-2">What&apos;s next?</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Check your inbox (and spam folder)</li>
            <li>2. Click the sign-in link in the email</li>
            <li>3. You&apos;ll be automatically signed in</li>
          </ol>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            onClick={handleResendLink}
            disabled={loading}
            className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
          >
            {loading ? "Sending..." : "Resend link"}
          </Button>

          <button
            onClick={() => setStep(1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {step === 1 ? "Create your account" : "Account created!"}
        </h1>
        <p className="text-muted-foreground">
          {step === 1 
            ? "Join thousands of students already studying smarter" 
            : "Almost there! Just check your email to continue"
          }
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            step >= 1 ? "bg-purple-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`w-2 h-2 rounded-full ${
            step >= 2 ? "bg-purple-600" : "bg-gray-300"
          }`}
        />
      </div>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}

      {/* Footer */}
      {step === 1 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-brand-amber hover:text-primary/80 font-semibold transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}