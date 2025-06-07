"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function SignInContent() {
  const [step, setStep] = useState(1); // 1: email input, 2: magic link sent
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const handleSignIn = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setError("No account found with this email. Please sign up first.");
        } else {
          setError("Failed to send magic link. Please try again.");
        }
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    try {
      await signIn("email", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });
    } catch (error) {
      console.error("Resend error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="p-6">
      <div className="space-y-4">
        {(error || errorParam) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              {error || "Authentication failed. Please try again."}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              required
            />
          </div>
        </div>

        <Button
          onClick={handleSignIn}
          className="w-full h-12"
          disabled={!email.trim() || loading}
        >
          {loading ? (
            "Sending link..."
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send magic link
            </>
          )}
        </Button>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Check your email!
          </h2>
          <p className="text-gray-600">
            We&apos;ve sent a secure sign-in link to:
          </p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
          <h3 className="font-medium text-purple-900 mb-2">
            What&apos;s next?
          </h3>
          <ol className="text-sm text-purple-800 space-y-1">
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
            className="w-full"
          >
            {loading ? "Sending..." : "Resend link"}
          </Button>

          <button
            onClick={() => {
              setStep(1);
              setError("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
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
        <h1 className="text-2xl font-bold text-gray-900">
          {step === 1 ? "Welcome back" : "Check your email!"}
        </h1>
        <p className="text-gray-600">
          {step === 1
            ? "Sign in to your account"
            : "We've sent you a secure sign-in link"}
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
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="text-amber-600 hover:text-amber-800 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function SignInSkeleton() {
  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      <Card className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>

      <div className="text-center">
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSkeleton />}>
      <SignInContent />
    </Suspense>
  );
}
