import { z } from "zod";

export const validateSubscriptionPOSTAction = z.object({
  action: z.enum(['create-checkout', 'create-portal'])
    .describe('Action to perform: create-checkout for new subscription or create-portal for managing existing subscription')
}).strict();

export const upgradeToProSchema = z.object({
  priceId: z.string().describe('Stripe price ID for the Pro plan'),
  successUrl: z.string().url().describe('URL to redirect after successful payment'),
  cancelUrl: z.string().url().describe('URL to redirect if payment is cancelled'),
}).strict();

export const manageSubscriptionSchema = z.object({
    returnUrl: z.string().url().describe('URL to redirect after managing subscription'),
}).strict();
