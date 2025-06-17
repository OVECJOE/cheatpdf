"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

function VerifyRequestContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  const handleResendLink = async () => {
    if (email === "your email") return;

    setLoading(true);
    try {
      await signIn("email", {
        email,
        redirect: false,
      });
    } catch {
      toast("Failed to resend link. Please try again.", {
        dismissible: true,
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="text-muted-foreground">
          We&apos;ve sent you a secure sign-in link
        </p>
      </div>

      <Card className="p-6 bg-card border-border transition-all duration-300 hover:shadow-lg">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">A sign-in link has been sent to:</p>
            <p className="font-medium text-foreground">{email}</p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left">
            <h3 className="font-medium text-foreground mb-2">
              What&apos;s next?
            </h3>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Check your inbox (and spam folder)</li>
              <li>2. Click the sign-in link in the email</li>
              <li>3. You&apos;ll be automatically signed in</li>
            </ol>
          </div>

          <div className="space-y-3 pt-4">
            {email !== "your email" && (
              <Button
                variant="outline"
                onClick={handleResendLink}
                disabled={loading}
                className="w-full border-border text-foreground hover:bg-muted transition-all duration-300"
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Resend link"}
              </Button>
            )}

            <div className="space-y-2">
              <Link
                href="/auth/sign-in"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                ← Use a different email
              </Link>
              <Link
                href="/auth/sign-up"
                className="block text-sm text-brand-amber hover:text-primary/80 font-semibold transition-colors duration-200"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRequestContent />
    </Suspense>
  );
}
