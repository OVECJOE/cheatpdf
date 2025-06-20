'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Download, Share2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PWAManager() {
    const { data: session, status } = useSession()
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Check if push notifications are supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }

        // Check if app is installed
        setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)

        // Check if iOS
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & typeof globalThis & { MSStream: unknown }).MSStream)
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })

            // Check existing subscription
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            console.log('New service worker available')
                        }
                    })
                }
            })
        } catch (error) {
            console.error('Service worker registration failed:', error)
        }
    }

    async function subscribeToPush() {
        if (!session?.user?.id) return

        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            })

            setSubscription(sub)

            // Send subscription to server
            const serializedSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.getKey('p256dh')?.toString() || '',
                    auth: sub.getKey('auth')?.toString() || '',
                },
            }

            await subscribeUser(serializedSub, session.user.id)
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function unsubscribeFromPush() {
        if (!session?.user?.id) return

        setIsLoading(true)
        try {
            await subscription?.unsubscribe()
            setSubscription(null)
            await unsubscribeUser(session.user.id)
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function sendTestNotification() {
        if (!subscription || !session?.user?.id) return

        setIsLoading(true)
        try {
            await sendNotification(session.user.id, message || 'Test notification from CheatPDF!')
            setMessage('')
        } catch (error) {
            console.error('Failed to send test notification:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Push notifications are not supported in this browser.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                    <CardDescription>
                        Get notified about document processing updates and new features
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {subscription ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-green-500">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Subscribed
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    You&apos;ll receive notifications about your documents
                                </span>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Enter test notification message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <Button
                                    onClick={sendTestNotification}
                                    disabled={isLoading}
                                    size="sm"
                                >
                                    Send Test Notification
                                </Button>
                            </div>

                            <Button
                                onClick={unsubscribeFromPush}
                                variant="outline"
                                disabled={isLoading}
                                size="sm"
                            >
                                <BellOff className="h-4 w-4 mr-2" />
                                Unsubscribe
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Subscribe to receive notifications about document processing and updates
                            </p>
                            <Button
                                onClick={subscribeToPush}
                                disabled={isLoading || status !== 'authenticated'}
                                size="sm"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                Subscribe to Notifications
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Install Prompt */}
            {!isInstalled && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Install App
                        </CardTitle>
                        <CardDescription>
                            Install CheatPDF on your device for a better experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isIOS ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    To install this app on your iOS device:
                                </p>
                                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>1. Tap the share button <Share2 className="h-4 w-4 inline" /></li>
                                    <li>2. Select &quot;Add to Home Screen&quot;</li>
                                    <li>3. Tap &quot;Add&quot; to install</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Click the install button in your browser&apos;s address bar or menu to install CheatPDF
                                </p>
                                <Badge variant="secondary">
                                    Available for installation
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* PWA Status */}
            <Card>
                <CardHeader>
                    <CardTitle>PWA Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Service Worker:</span>
                            <Badge variant={isSupported ? "default" : "destructive"}>
                                {isSupported ? "Active" : "Not Supported"}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span>Push Notifications:</span>
                            <Badge variant={subscription ? "default" : "secondary"}>
                                {subscription ? "Subscribed" : "Not Subscribed"}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span>App Installation:</span>
                            <Badge variant={isInstalled ? "default" : "secondary"}>
                                {isInstalled ? "Installed" : "Not Installed"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 