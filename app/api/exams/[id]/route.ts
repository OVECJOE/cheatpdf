import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/config/auth";
import { examService } from "@/lib/services/exam";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'results') {
      // Get exam results (for completed exams)
      const results = await examService.getResults(id, session.user.id);
      return NextResponse.json({ results });
    } else if (action === 'taking') {
      // Get exam for taking (in progress exams)
      const exam = await examService.getExamForTaking(id, session.user.id);
      return NextResponse.json({ exam });
    } else {
      // Get exam details for overview
      const exam = await examService.getExamDetails(id, session.user.id);
      return NextResponse.json({ exam });
    }
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch exam" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, questionId, answer } = body;

    switch (action) {
      case 'start':
        // Start an exam
        const startedExam = await examService.start(id, session.user.id);
        return NextResponse.json({ exam: startedExam });

      case 'answer':
        // Submit an answer
        if (!questionId || !answer) {
          return NextResponse.json(
            { error: "Question ID and answer are required" },
            { status: 400 }
          );
        }
        const result = await examService.submitAnswer(id, questionId, answer, session.user.id);
        return NextResponse.json({ result });

      case 'complete':
        // Complete an exam
        const completedExam = await examService.complete(id, session.user.id);
        return NextResponse.json({ exam: completedExam });

      default:
        return NextResponse.json(
          { error: "Invalid action. Valid actions: start, answer, complete" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update exam" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await examService.delete(id, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete exam" },
      { status: 400 }
    );
  }
} 