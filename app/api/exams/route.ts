import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { examService } from '@/lib/services/exam'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await examService.getUserExams(session.user.id)
    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch exams' },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, title, timeLimit, numQuestions, difficultyLevel } = body

    // Validate required fields
    if (!documentId || !title || !timeLimit) {
      return NextResponse.json(
        { error: 'Document ID, title, and time limit are required' },
        { status: 400 }
      )
    }

    const exam = await examService.create(
      session.user.id,
      documentId,
      title,
      timeLimit,
      difficultyLevel,
      numQuestions || 10
    )

    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create exam' },
      { status: 400 }
    )
  }
}
