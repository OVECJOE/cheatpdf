import { NextResponse } from "next/server";
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent chats
    const recentChats = await prisma.chat.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        document: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent exams
    const recentExams = await prisma.exam.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        document: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Combine and format activities
    const activities = [
      ...recentDocuments.map(doc => ({
        id: doc.id,
        type: "document" as const,
        title: doc.name,
        createdAt: doc.createdAt,
      })),
      ...recentChats.map(chat => ({
        id: chat.id,
        type: "chat" as const,
        title: chat.title,
        createdAt: chat.createdAt,
        documentName: chat.document.name,
      })),
      ...recentExams.map(exam => ({
        id: exam.id,
        type: "exam" as const,
        title: exam.title,
        createdAt: exam.createdAt,
        documentName: exam.document.name,
      })),
    ];

    // Sort by creation date and limit to 10 most recent
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json({
      activities: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 