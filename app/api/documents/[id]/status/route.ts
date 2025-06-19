import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import db from '@/lib/config/db'
import { DocumentExtractionStage } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Verify document exists and belongs to user
    const document = await db.document.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { status, error } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Map status string to enum
    let extractionStage: DocumentExtractionStage
    switch (status.toUpperCase()) {
      case 'PENDING':
        extractionStage = DocumentExtractionStage.PENDING
        break
      case 'PDF_PARSE':
        extractionStage = DocumentExtractionStage.PDF_PARSE
        break
      case 'PER_PAGE':
        extractionStage = DocumentExtractionStage.PER_PAGE
        break
      case 'FAILED':
        extractionStage = DocumentExtractionStage.FAILED
        break
      default:
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update document status
    const updatedDocument = await db.document.update({
      where: { id },
      data: {
        extractionStage,
        content: error ? `Error: ${error}` : document.content,
        vectorized: status === 'COMPLETED',
      },
    })

    return NextResponse.json({ 
      success: true, 
      document: updatedDocument 
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
} 