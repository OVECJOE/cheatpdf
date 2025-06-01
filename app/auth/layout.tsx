import AppLogo from "@/components/app-logo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CheatPDF - Authentication",
  description:
    "Sign up or sign in to your CheatPDF account to access your AI-powered study assistant.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Headerr */}
        <div className="text-center flex flex-col items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
          <AppLogo />
        </div>
        {children}
      </div>
    </div>
  );
}
