import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import { subscriptionService } from "@/lib/services/subscription";
import {
  manageSubscriptionSchema,
  upgradeToProSchema,
  validateSubscriptionPOSTAction,
} from "@/lib/validations";
import { ZodError } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await subscriptionService.getSubscriptionStatus(
      session.user.id,
    );
    return NextResponse.json({ status });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action: validatedAction,
    } = await validateSubscriptionPOSTAction.parseAsync({
      action: body.action,
    });

    if (validatedAction === "create-checkout") {
      const { priceId, successUrl, cancelUrl } = body;
      const data = await upgradeToProSchema.parseAsync({
        priceId,
        successUrl,
        cancelUrl,
      });

      const session_stripe = await subscriptionService.createCheckoutSession(
        session.user.id,
        data.priceId,
        data.successUrl,
        data.cancelUrl,
      );

      return NextResponse.json({ url: session_stripe.url });
    }

    if (validatedAction === "create-portal") {
      const { returnUrl } = body;
      const data = await manageSubscriptionSchema.parseAsync({
        returnUrl,
      });

      const portalSession = await subscriptionService.createPortalSession(
        session.user.id,
        data.returnUrl,
      );

      return NextResponse.json({ url: portalSession.url });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error handling subscription request:", error);
    let errorMessage = "Failed to process subscription request";
    if (error instanceof ZodError) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    }

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
