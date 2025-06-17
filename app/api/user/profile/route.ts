import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { default as prisma } from "@/lib/config/db";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                _count: {
                    select: {
                        documents: true,
                        chats: true,
                        exams: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEnds: user.subscriptionEnds,
            createdAt: user.createdAt,
            _count: user._count,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { name: name.trim() },
            include: {
                _count: {
                    select: {
                        documents: true,
                        chats: true,
                        exams: true,
                    },
                },
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEnds: user.subscriptionEnds,
            createdAt: user.createdAt,
            _count: user._count,
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}