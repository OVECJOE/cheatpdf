import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import db from "@/lib/config/db";
import { User, UserType } from "@prisma/client";
import { onboardingSchema } from "@/lib/validations";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                userType: true,
                country: true,
                language: true,
                educationLevel: true,
                subjects: true,
                company: true,
                role: true,
                onboardingCompleted: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, {
                status: 404,
            });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching onboarding data:", error);
        return NextResponse.json(
            { error: "Failed to fetch onboarding data" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const body = await request.json();
        const {
            userType,
            educationLevel,
            subjects,
            studyGoals,
            examType
        } = onboardingSchema.parse(body);

        // Update user profile
        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                userType,
                educationLevel,
                subjects,
                studyGoals,
                examType,
                onboardingCompleted: true,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("Error updating onboarding data:", error);
        return NextResponse.json(
            { error: "Failed to update onboarding data" },
            { status: 500 },
        );
    }
}
