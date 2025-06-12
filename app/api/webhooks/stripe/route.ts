import { NextRequest, NextResponse } from 'next/server'
import { subscriptionService } from '@/lib/services/subscription'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    subscriptionService.handleWebhook(body, signature)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' + (error as Error).message },
      { status: 400 }
    )
  }
}