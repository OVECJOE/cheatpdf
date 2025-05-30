import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/config/db";

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, country, language, userType } = await request.json();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                country,
                language,
                userType: userType || "student",
                emailVerified: new Date(), // Auto-verify for demo
            }
        });

        return NextResponse.json(
            { 
                message: "User created successfully",
                userId: user.id
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}