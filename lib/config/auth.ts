// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { default as prisma } from "@/lib/config/db";
import { sendMagicLinkEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      // Custom send verification request using Resend
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await sendMagicLinkEmail(email, url);
        } catch (error) {
          console.error("Failed to send magic link email:", error);
          throw new Error("Failed to send magic link email");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For email provider, check if user exists in database
      if (account?.provider === "email") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        // If user doesn't exist, prevent sign in
        if (!existingUser) {
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Add user info to session
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            onboardingCompleted: true,
            userType: true,
            subscriptionStatus: true,
          },
        });

        if (!dbUser) {
          throw new Error("User not found in database");
        }

        session.user.id = dbUser?.id;
        session.user.onboardingCompleted = dbUser?.onboardingCompleted;
        session.user.userType = dbUser?.userType;
        session.user.subscriptionStatus = dbUser?.subscriptionStatus;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after magic link authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect logic
      const urlParams = new URL(url).searchParams;
      const callbackUrl = urlParams.get("callbackUrl");

      if (callbackUrl) {
        return `${baseUrl}${callbackUrl}`;
      }

      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign ins
      console.log(`User ${user.email} signed in with ${account?.provider}`);
    },
    async createUser({ user }) {
      // This won't be called since we're creating users manually
      console.log(`New user created: ${user.email}`);
    },
  },
  session: {
    strategy: "database",
  },
  debug: process.env.NODE_ENV === "development",
};
