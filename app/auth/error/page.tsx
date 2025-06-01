"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in. Please create an account first.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errorMessages;
  
  const errorMessage = errorMessages[error] || errorMessages.Default;
  const isAccessDenied = error === "AccessDenied";

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        <p className="text-gray-600">Something went wrong</p>
      </div>

      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAccessDenied ? "Access Denied" : "Error"}
            </h2>
            <p className="text-gray-600 text-sm">
              {errorMessage}
            </p>
          </div>

          {isAccessDenied && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <h3 className="font-medium text-amber-900 mb-2">Need an account?</h3>
              <p className="text-sm text-amber-800">
                It looks like you don&apos;t have an account yet. Create one to get started.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4">
            {isAccessDenied ? (
              <Link href="/auth/sign-up">
                <Button className="w-full">
                  Create Account
                </Button>
              </Link>
            ) : (
              <Link href="/auth/sign-in">
                <Button className="w-full">
                  Try Again
                </Button>
              </Link>
            )}

            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Need help?{" "}
          <Link
            href="/support"
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}