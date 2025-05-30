import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { subscriptionService } from '@/lib/services/subscription'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await subscriptionService.getSubscriptionStatus(session.user.id)
    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, successUrl, cancelUrl, returnUrl } = body

    if (action === 'create-checkout') {
      if (!successUrl || !cancelUrl) {
        return NextResponse.json(
          { error: 'Success URL and cancel URL are required' },
          { status: 400 }
        )
      }

      const session_stripe = await subscriptionService.createCheckoutSession(
        session.user.id,
        successUrl,
        cancelUrl
      )

      return NextResponse.json({ url: session_stripe.url })
    }

    if (action === 'create-portal') {
      if (!returnUrl) {
        return NextResponse.json(
          { error: 'Return URL is required' },
          { status: 400 }
        )
      }

      const portalSession = await subscriptionService.createPortalSession(
        session.user.id,
        returnUrl
      )

      return NextResponse.json({ url: portalSession.url })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling subscription request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process subscription request' },
      { status: 500 }
    )
  }
}
