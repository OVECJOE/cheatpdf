import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { default as prisma } from "@/lib/config/db";
import { chatService } from "@/lib/services/chat";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        document: {
          select: {
            id: true,
            name: true,
            fileName: true,
          },
        },
        messages: {
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1, // Get the last message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch chats" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, title } = body;

    if (!documentId || !title) {
      return NextResponse.json({ error: "Document ID and title are required" }, { status: 400 });
    }

    const chat = await chatService.create(session.user.id, documentId, title);
    return NextResponse.json({ chat });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create chat" },
      { status: 400 }
    );
  }
}
