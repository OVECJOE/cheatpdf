// lib/services/donation.ts
import Stripe from "stripe";
import db from "@/lib/config/db";
import { Donation, DonationFrequency } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil",
});

interface CreateDonationData {
    donorEmail: string;
    donorName: string;
    targetCountry?: string;
    targetLanguage?: string;
    studentsToHelp: number;
    donationFrequency: DonationFrequency;
    amount: number;
}

class DonationService {
    async createDonationCheckout(data: CreateDonationData) {
        try {
            // Create donation record in database
            const donation = await db.donation.create({
                data: {
                    donorEmail: data.donorEmail,
                    donorName: data.donorName,
                    targetCountry: data.targetCountry || null,
                    targetLanguage: data.targetLanguage || null,
                    studentsToHelp: data.studentsToHelp,
                    donationFrequency: data.donationFrequency,
                    amount: data.amount,
                    status: "PENDING",
                },
            });

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `CheatPDF Student Sponsorship`,
                                description:
                                    `Help ${data.studentsToHelp} student${
                                        data.studentsToHelp > 1 ? "s" : ""
                                    } access CheatPDF Pro`,
                            },
                            unit_amount: Math.round(data.amount * 100), // Convert to cents
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url:
                    `${process.env.NEXT_PUBLIC_BASE_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url:
                    `${process.env.NEXT_PUBLIC_BASE_URL}/donate?cancelled=true`,
                customer_email: data.donorEmail,
                metadata: {
                    donationId: donation.id,
                    studentsToHelp: data.studentsToHelp.toString(),
                    donationFrequency: data.donationFrequency,
                    targetCountry: data.targetCountry || "",
                    targetLanguage: data.targetLanguage || "",
                },
            });

            // Update donation with Stripe session ID
            await db.donation.update({
                where: { id: donation.id },
                data: { stripeSessionId: session.id },
            });

            return session;
        } catch {
            throw new Error("Failed to create donation checkout");
        }
    }

    async handleSuccessfulDonation(session: Stripe.Checkout.Session) {
        try {
            const donationId = session.metadata?.donationId;
            if (!donationId) {
                throw new Error("No donation ID in session metadata");
            }

            // Update donation status
            const donation = await db.donation.update({
                where: { id: donationId },
                data: {
                    status: "COMPLETED",
                    stripePaymentId: session.payment_intent as string,
                    metadata: session.metadata || {},
                },
            });

            // Find eligible students to help
            await this.assignBeneficiaries(donation);

            // Update donation stats
            await this.updateDonationStats();
        } catch (error) {
            throw error;
        }
    }

    async handleFailedDonation(session: Stripe.Checkout.Session) {
        try {
            const donationId = session.metadata?.donationId;
            if (!donationId) {
                return;
            }

            await db.donation.update({
                where: { id: donationId },
                data: { status: "FAILED" },
            });
        } catch {
        }
    }

    private async assignBeneficiaries(donation: Donation) {
        try {
            // Find eligible students based on criteria
            const whereClause: Record<string, string> = {
                subscriptionStatus: "FREE",
                // Add more criteria as needed
            };

            if (
                donation.targetCountry &&
                donation.targetCountry !== "Any Country"
            ) {
                whereClause.country = donation.targetCountry;
            }

            if (
                donation.targetLanguage &&
                donation.targetLanguage !== "Any Language"
            ) {
                whereClause.language = donation.targetLanguage;
            }

            const eligibleStudents = await db.user.findMany({
                where: whereClause,
                take: donation.studentsToHelp,
                orderBy: { createdAt: "asc" }, // First come, first served
            });

            // Calculate months to grant based on donation frequency
            const monthsMap = {
                MONTHLY: 1,
                QUARTERLY: 3,
                BIANNUAL: 6,
            };

            const monthsToGrant =
                monthsMap[donation.donationFrequency as keyof typeof monthsMap];

            // Create beneficiary records and update user subscriptions
            for (const student of eligibleStudents) {
                // Calculate expiration date
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + monthsToGrant);

                // Create beneficiary record
                await db.studentBeneficiary.create({
                    data: {
                        userId: student.id,
                        donationId: donation.id,
                        monthsGranted: monthsToGrant,
                        expiresAt,
                    },
                });

                // Update user's subscription status
                await db.user.update({
                    where: { id: student.id },
                    data: {
                        subscriptionStatus: "ACTIVE",
                    },
                });
            }
            return eligibleStudents;
        } catch (error) {
            throw error;
        }
    }

    private async updateDonationStats() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get total donation stats
            const totalStats = await db.donation.aggregate({
                where: { status: "COMPLETED" },
                _sum: {
                    amount: true,
                },
                _count: {
                    id: true,
                },
            });

            // Get current month stats
            const monthStats = await db.donation.aggregate({
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: startOfMonth,
                    },
                },
                _sum: {
                    amount: true,
                    studentsToHelp: true,
                },
            });

            // Get total students helped
            const totalStudentsHelped = await db.studentBeneficiary.count();

            // Update or create donation stats
            await db.donationStats.upsert({
                where: { id: "global-stats" },
                update: {
                    totalDonations: totalStats._sum.amount || 0,
                    totalStudentsHelped,
                    currentMonthDonations: monthStats._sum.amount || 0,
                    currentMonthStudents: monthStats._sum.studentsToHelp || 0,
                    lastUpdated: now,
                },
                create: {
                    id: "global-stats",
                    totalDonations: totalStats._sum.amount || 0,
                    totalStudentsHelped,
                    currentMonthDonations: monthStats._sum.amount || 0,
                    currentMonthStudents: monthStats._sum.studentsToHelp || 0,
                    lastUpdated: now,
                },
            });
        } catch {
            // Don't throw error as this is not critical
        }
    }

    async getDonationStats() {
        try {
            const stats = await db.donationStats.findUnique({
                where: { id: "global-stats" },
            });

            return (
                stats || {
                    totalDonations: 0,
                    totalStudentsHelped: 0,
                    currentMonthDonations: 0,
                    currentMonthStudents: 0,
                }
            );
        } catch {
            throw new Error("Failed to fetch donation statistics");
        }
    }

    async getDonationHistory(donorEmail?: string, limit: number = 50) {
        try {
            const whereClause = donorEmail ? { donorEmail } : {};

            const donations = await db.donation.findMany({
                where: {
                    ...whereClause,
                    status: "COMPLETED",
                },
                include: {
                    beneficiaries: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    country: true,
                                    language: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            return donations;
        } catch {
            throw new Error("Failed to fetch donation history");
        }
    }

    async getEligibleStudentsCount(
        targetCountry?: string,
        targetLanguage?: string,
    ) {
        try {
            const whereClause: Record<string, string> = {
                subscriptionStatus: "FREE",
            };

            if (targetCountry && targetCountry !== "Any Country") {
                whereClause.country = targetCountry;
            }

            if (targetLanguage && targetLanguage !== "Any Language") {
                whereClause.language = targetLanguage;
            }

            const count = await db.user.count({
                where: whereClause,
            });

            return count;
        } catch {
            throw new Error("Failed to count eligible students");
        }
    }

    async getActiveBeneficiaries(userId?: string) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const whereClause: any = {
                expiresAt: {
                    gt: new Date(),
                },
            };

            if (userId) {
                whereClause.userId = userId;
            }

            const beneficiaries = await db.studentBeneficiary.findMany({
                where: whereClause,
                include: {
                    donation: {
                        select: {
                            donorName: true,
                            donorEmail: true,
                            donationFrequency: true,
                            amount: true,
                            createdAt: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            country: true,
                            language: true,
                        },
                    },
                },
                orderBy: { expiresAt: "desc" },
            });

            return beneficiaries;
        } catch {
            throw new Error("Failed to fetch active beneficiaries");
        }
    }

    async expireBeneficiaries() {
        try {
            const now = new Date();

            // Find expired beneficiaries
            const expiredBeneficiaries = await db.studentBeneficiary.findMany({
                where: {
                    expiresAt: {
                        lte: now,
                    },
                },
                include: {
                    user: true,
                },
            });

            // Update users back to FREE tier
            for (const beneficiary of expiredBeneficiaries) {
                // Check if user has other active beneficiaries
                const otherActiveBeneficiaries = await db.studentBeneficiary
                    .count({
                        where: {
                            userId: beneficiary.userId,
                            expiresAt: {
                                gt: now,
                            },
                            id: {
                                not: beneficiary.id,
                            },
                        },
                    });

                // Only downgrade if no other active sponsorships
                if (otherActiveBeneficiaries === 0) {
                    await db.user.update({
                        where: { id: beneficiary.userId },
                        data: {
                            subscriptionStatus: "FREE",
                        },
                    });
                }
            }

            // Delete expired beneficiary records
            await db.studentBeneficiary.deleteMany({
                where: {
                    expiresAt: {
                        lte: now,
                    },
                },
            });
            return expiredBeneficiaries.length;
        } catch {
            throw new Error("Failed to expire beneficiaries");
        }
    }

    async getUserBeneficiaryStatus(userId: string) {
        try {
            const activeBeneficiary = await db.studentBeneficiary.findFirst({
                where: {
                    userId,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                include: {
                    donation: {
                        select: {
                            donorName: true,
                            donationFrequency: true,
                            amount: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { expiresAt: "desc" },
            });

            return activeBeneficiary;
        } catch {
            throw new Error("Failed to fetch beneficiary status");
        }
    }

    async calculateDonationAmount(
        studentsToHelp: number,
        donationFrequency: DonationFrequency,
    ) {
        try {
            // Base monthly cost per student
            const monthlyFeePerStudent = 5;

            const monthsMap = {
                MONTHLY: 1,
                QUARTERLY: 3,
                BIANNUAL: 6,
            };

            const months = monthsMap[donationFrequency];
            const amount = studentsToHelp * monthlyFeePerStudent * months;

            return {
                amount,
                monthlyFeePerStudent,
                months,
                breakdown: {
                    studentsToHelp,
                    monthlyFeePerStudent,
                    months,
                    total: amount,
                },
            };
        } catch {
            throw new Error("Failed to calculate donation amount");
        }
    }

    async getDonationById(id: string) {
        try {
            const donation = await db.donation.findUnique({
                where: { id },
                include: {
                    beneficiaries: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    country: true,
                                    language: true,
                                },
                            },
                        },
                    },
                },
            });

            return donation;
        } catch {
            throw new Error("Failed to fetch donation");
        }
    }

    async getDonationBySessionId(sessionId: string) {
        try {
            const donation = await db.donation.findUnique({
                where: { stripeSessionId: sessionId },
            });

            return donation;
        } catch {
            throw new Error("Failed to fetch donation");
        }
    }
}

export const donationService = new DonationService();
export default donationService;
