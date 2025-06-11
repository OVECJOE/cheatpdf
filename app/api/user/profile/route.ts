import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import db from "@/lib/config/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            country: user.country,
            language: user.language,
            userType: user.userType,
            subscriptionStatus: user.subscriptionStatus,
            createdAt: user.createdAt,
            isEmailVerified: user.emailVerified !== null,
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}