import { SubscriptionStatus, UserType } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string;
            email?: string;
            onboardingCompleted?: boolean;
            userType: UserType;
            subscriptionStatus?: SubscriptionStatus;
        }
    }
}
