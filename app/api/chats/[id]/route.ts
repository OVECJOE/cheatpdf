import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { default as prisma } from "@/lib/config/db";
import { chatService } from '@/lib/services/chat'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const chat = await chatService.getChatHistory(id, session.user.id, offset, limit);
    if (typeof offset !== 'undefined' || typeof limit !== 'undefined') {
      // Paginated response
      return NextResponse.json({
        messages: chat.messages,
        totalCount: chat.totalCount,
      });
    } else {
      // Full chat object
      return NextResponse.json({ chat });
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch chats' },
      { status: 400 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body
    const { id } = await params;
    // Send message
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const messageResponse = await chatService.sendMessage(
      id,
      message,
      session.user.id
    )

    return NextResponse.json({
      message: {
        content: messageResponse.content,
        role: messageResponse.role,
        createdAt: messageResponse.createdAt,
        id: messageResponse.id,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process chat request' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify the chat belongs to the user
    const chat = await prisma.chat.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete the chat and all its messages (cascade delete should handle this)
    await prisma.chat.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete chat" },
      { status: 400 }
    );
  }
} 