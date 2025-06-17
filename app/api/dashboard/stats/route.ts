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

    // Get document stats
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      select: { fileSize: true },
    });

    // Get chat count
    const chatCount = await prisma.chat.count({
      where: { userId: user.id },
    });

    // Get exam count
    const examCount = await prisma.exam.count({
      where: { userId: user.id },
    });

    // Calculate total storage
    const totalStorage = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    return NextResponse.json({
      documents: documents.length,
      chats: chatCount,
      exams: examCount,
      totalStorage,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 