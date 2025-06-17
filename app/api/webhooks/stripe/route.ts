import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/services/subscription'

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Await the async webhook handler
    await subscriptionService.handleWebhook(body, signature);
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    
    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 400 }
    );
  }
}