import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import db from "@/lib/config/db";
import { UserType } from "@prisma/client";

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, country, language, userType } = await request.json();
        if (userType && !Object.values(UserType).includes(userType.toUpperCase())) {
            return NextResponse.json(
                { message: "Invalid user type" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
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
        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                country,
                language,
                userType: userType || UserType.STUDENT,
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