import { NextRequest, NextResponse } from "next/server";
import { donationService } from "@/lib/services/donation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.STRIPE_DONATION_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_DONATION_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_DONATION_WEBHOOK_SECRET!
      );
    } catch (webhookError) {
      console.error('Webhook signature verification failed:', webhookError);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await donationService.handleSuccessfulDonation(event.data.object as Stripe.Checkout.Session);
          console.log(`Successfully processed donation completion for session: ${event.data.object.id}`);
          break;
        case "checkout.session.expired":
          await donationService.handleFailedDonation(event.data.object as Stripe.Checkout.Session);
          console.log(`Successfully processed donation expiration for session: ${event.data.object.id}`);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (serviceError) {
      console.error(`Error processing ${event.type} event:`, serviceError);
      // Still return 200 to acknowledge receipt, but log the error
      // This prevents Stripe from retrying if it's a permanent error
      return NextResponse.json(
        { received: true, warning: `Event processed but service error occurred: ${event.type}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Donation webhook handler failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 400 }
    );
  }
}