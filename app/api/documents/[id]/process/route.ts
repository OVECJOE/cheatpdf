import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import { DocumentExtractionStage } from '@prisma/client'

export async function POST(
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
        extractionStage: DocumentExtractionStage.PENDING,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found or already processed' }, { status: 404 })
    }

    // Get request body
    const body = await request.json()
    const { buffer: base64Buffer, fileName, userId } = body

    if (!base64Buffer || !fileName || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(base64Buffer, 'base64')

    // Process the document
    try {
      await documentProcessor.processAndStoreDocument(
        buffer,
        fileName,
        userId,
        id
      )

      return NextResponse.json({ success: true, message: 'Document processed successfully' })
    } catch (error) {
      console.error('Document processing failed:', error)
      
      // Update document status to failed
      await db.document.update({
        where: { id },
        data: {
          extractionStage: DocumentExtractionStage.FAILED,
          content: `Failed to process document: ${(error as Error).message}`,
        },
      })

      return NextResponse.json(
        { error: 'Document processing failed: ' + (error as Error).message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Process route error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
} 