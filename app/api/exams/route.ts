import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { examService } from '@/lib/services/exam'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const action = searchParams.get('action')

    if (examId && action === 'results') {
      // Get exam results
      const results = await examService.getResults(examId, session.user.id)
      return NextResponse.json({ results })
    } else if (examId) {
      // Get specific exam (for taking exam)
      const exam = await examService.start(examId, session.user.id)
      return NextResponse.json({ exam })
    } else {
      // Get all user exams
      const exams = await examService.getUserExams(session.user.id)
      return NextResponse.json({ exams })
    }
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exams' },
      { status: 500 }
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
    const { action, examId, documentId, title, timeLimit, numQuestions, questionId, answer } = body

    if (action === 'create') {
      // Create new exam
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
        numQuestions || 10
      )

      return NextResponse.json({ exam }, { status: 201 })
    }

    if (action === 'start') {
      // Start exam
      if (!examId) {
        return NextResponse.json(
          { error: 'Exam ID is required' },
          { status: 400 }
        )
      }

      const exam = await examService.start(examId, session.user.id)
      return NextResponse.json({ exam })
    }

    if (action === 'answer') {
      // Submit answer
      if (!examId || !questionId || !answer) {
        return NextResponse.json(
          { error: 'Exam ID, question ID, and answer are required' },
          { status: 400 }
        )
      }

      const result = await examService.submit(
        examId,
        questionId,
        answer,
        session.user.id
      )

      return NextResponse.json({ result })
    }

    if (action === 'complete') {
      // Complete exam
      if (!examId) {
        return NextResponse.json(
          { error: 'Exam ID is required' },
          { status: 400 }
        )
      }

      const results = await examService.complete(examId, session.user.id)
      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling exam request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process exam request' },
      { status: 500 }
    )
  }
}
