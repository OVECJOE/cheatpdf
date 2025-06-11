import { SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import dayjs from "dayjs";
import db from "@/lib/config/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil",
});

export class SubscriptionService {
    public async createCheckoutSession(
        userId: string,
        priceId: string,
        successUrl: string,
        cancelUrl: string,
    ) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new Error("User not found");
            }

            let customerId = user.stripeCustomerId;

            // Create Strip customer if it doesn't exist
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: user.name || undefined,
                    metadata: {
                        userId: user.id,
                    },
                });

                customerId = customer.id;

                // Update user with customer ID
                await db.user.update({
                    where: { id: userId },
                    data: { stripeCustomerId: customerId },
                });
            }

            // Create checkout session
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ["card", "link"],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: "subscription",
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId: user.id,
                },
            });

            return session;
        } catch (error) {
            console.error("Error creating checkout session:", error);
            throw new Error("Failed to create checkout session");
        }
    }

    public async createPortalSession(userId: string, returnUrl: string) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
            });

            if (!user || !user.stripeCustomerId) {
                throw new Error("User not found or no subscription");
            }

            const session = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: returnUrl,
            });

            return session;
        } catch (error) {
            console.error("Error creating portal session:", error);
            throw new Error("Failed to create portal session");
        }
    }

    public async handleWebhook(payload: string, signature: string) {
        try {
            const event = stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET,
            );

            switch (event.type) {
                case "checkout.session.completed":
                    await this.handleCheckoutCompleted(
                        event.data.object as Stripe.Checkout.Session,
                    );
                    break;
                case "invoice.payment_succeeded":
                    await this.handlePaymentSucceeded(
                        event.data.object as Stripe.Invoice,
                    );
                    break;
                case "invoice.payment_failed":
                    await this.handlePaymentFailed(
                        event.data.object as Stripe.Invoice,
                    );
                    break;
                case "customer.subscription.updated":
                    await this.handleSubscriptionUpdated(
                        event.data.object as Stripe.Subscription,
                    );
                    break;
                case "customer.subscription.deleted":
                    await this.handleSubscriptionDeleted(
                        event.data.object as Stripe.Subscription,
                    );
                    break;
                default:
                    console.warn(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            console.error("Error handling webhook:", error);
            throw new Error("Failed to handle webhook");
        }
    }

    private calculateSubscriptionEndDate(
        subscription: Stripe.Subscription,
    ): Date {
        if (subscription.days_until_due) {
            return dayjs().add(subscription.days_until_due, "day").toDate();
        }
        return dayjs(subscription.start_date * 1000).add(1, "month").toDate();
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.userId;
        if (!userId) {
            console.warn("No user ID found in checkout session metadata");
            return;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
        );
        await db.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: SubscriptionStatus.ACTIVE,
                subscriptionEnds: this.calculateSubscriptionEndDate(
                    subscription,
                ),
                stripeCustomerId: session.customer as string,
            },
        });
    }

    private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
        const customerId = invoice.customer as string;

        // Retrieve the subscriptions associated with the customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1, // Assuming one active subscription per customer
        });

        if (!subscriptions.data.length) {
            console.warn(
                `No active subscription found for customer ID: ${customerId}`,
            );
            return;
        }

        const subscription = subscriptions.data[0]; // Get the first active subscription

        const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.warn(`No user found for customer ID: ${customerId}`);
            return;
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: SubscriptionStatus.ACTIVE,
                subscriptionEnds: this.calculateSubscriptionEndDate(
                    subscription,
                ),
            },
        });
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        const customerId = invoice.customer as string;

        const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.error("User not found for customer:", customerId);
            return;
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: SubscriptionStatus.PAST_DUE,
            },
        });
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;

        const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.error("User not found for customer:", customerId);
            return;
        }

        let status: SubscriptionStatus;
        switch (subscription.status) {
            case "active":
                status = SubscriptionStatus.ACTIVE;
                break;
            case "past_due":
                status = SubscriptionStatus.PAST_DUE;
                break;
            case "canceled":
                status = SubscriptionStatus.CANCELED;
                break;
            default:
                status = SubscriptionStatus.FREE;
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: status,
                subscriptionEnds: this.calculateSubscriptionEndDate(
                    subscription,
                ),
            },
        });
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;

        const user = await db.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.error("User not found for customer:", customerId);
            return;
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: SubscriptionStatus.CANCELED,
                subscriptionEnds: new Date(subscription.canceled_at! * 1000),
            },
        });
    }

    async getSubscriptionStatus(userId: string) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    subscriptionStatus: true,
                    subscriptionEnds: true,
                    stripeCustomerId: true,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            return user;
        } catch (error) {
            console.error("Error getting subscription status:", error);
            throw error;
        }
    }
}

export const subscriptionService = new SubscriptionService();
