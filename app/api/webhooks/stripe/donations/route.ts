import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { donationService } from "@/lib/services/donation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_DONATION_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed":
        await donationService.handleSuccessfulDonation(event.data.object);
        break;
      case "checkout.session.expired":
        await donationService.handleFailedDonation(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Donation webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}