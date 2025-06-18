import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/config/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id },
    select: { startedAt: true, timeLimit: true, status: true }
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({
    startedAt: exam.startedAt,
    timeLimit: exam.timeLimit,
    status: exam.status,
    now: new Date().toISOString()
  });
} 