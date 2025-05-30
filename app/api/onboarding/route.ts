import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/config/auth";
import db from "@/lib/config/db";
import { UserType } from "@prisma/client";

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
            country,
            language,
            educationLevel,
            subjects,
            company,
            role,
        } = body;

        // Validate required fields
        if (!userType || !country || !language) {
            return NextResponse.json(
                { error: "User type, country, and language are required" },
                { status: 400 },
            );
        }

        // Validate user type specific fields
        if (userType === UserType.STUDENT) {
            if (!educationLevel || !subjects || subjects.length === 0) {
                return NextResponse.json(
                    {
                        error:
                            "Education level and subjects are required for students",
                    },
                    { status: 400 },
                );
            }
        } else if (userType === UserType.TALENT_SOURCER) {
            if (!company || !role) {
                return NextResponse.json(
                    {
                        error:
                            "Company and role are required for talent sourcers",
                    },
                    { status: 400 },
                );
            }
        }

        // Update user profile
        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                userType,
                country,
                language,
                educationLevel: userType === UserType.STUDENT
                    ? educationLevel
                    : null,
                subjects: userType === UserType.STUDENT ? subjects : [],
                company: userType === UserType.TALENT_SOURCER ? company : null,
                role: userType === UserType.TALENT_SOURCER ? role : null,
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
