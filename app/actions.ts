'use server'

import webpush from 'web-push'
import db from '@/lib/config/db'
import { PushSubscription } from '@prisma/client'

// Set VAPID details for push notifications
webpush.setVapidDetails(
  'mailto:info@cheatpdf.live',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function subscribeUser(sub: PushSubscriptionData, userId: string) {
  try {
    // Store subscription in database
    await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: sub.endpoint,
        },
      },
      update: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error subscribing user:', error)
    return { success: false, error: 'Failed to subscribe user' }
  }
}

export async function unsubscribeUser(userId: string, endpoint?: string) {
  try {
    if (endpoint) {
      // Remove specific subscription
      await db.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      })
    } else {
      // Remove all subscriptions for user
      await db.pushSubscription.deleteMany({
        where: {
          userId,
        },
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing user:', error)
    return { success: false, error: 'Failed to unsubscribe user' }
  }
}

export async function sendNotification(userId: string, message: string, title: string = 'CheatPDF') {
  try {
    // Get user's subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId,
      },
    })

    if (subscriptions.length === 0) {
      throw new Error('No subscriptions found for user')
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: '/dashboard',
        timestamp: Date.now(),
      },
    })

    // Send to all user subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        return webpush.sendNotification(pushSubscription, payload)
      })
    )

    // Check results
    const successful = results.filter((result: PromiseSettledResult<unknown>) => result.status === 'fulfilled').length
    const failed = results.filter((result: PromiseSettledResult<unknown>) => result.status === 'rejected').length

    console.log(`Sent notifications: ${successful} successful, ${failed} failed`)

    return { 
      success: true, 
      sent: successful, 
      failed 
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

// Send notification to all users (for admin purposes)
export async function sendNotificationToAll(message: string, title: string = 'CheatPDF') {
  try {
    const subscriptions = await db.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      throw new Error('No subscriptions found')
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: '/dashboard',
        timestamp: Date.now(),
      },
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        return webpush.sendNotification(pushSubscription, payload)
      })
    )

    const successful = results.filter((result: PromiseSettledResult<unknown>) => result.status === 'fulfilled').length
    const failed = results.filter((result: PromiseSettledResult<unknown>) => result.status === 'rejected').length

    return { 
      success: true, 
      sent: successful, 
      failed 
    }
  } catch (error) {
    console.error('Error sending notification to all:', error)
    return { success: false, error: 'Failed to send notification to all users' }
  }
} 