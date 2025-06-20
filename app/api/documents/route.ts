import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import { SubscriptionStatus } from '@prisma/client'
import { sanitizeFileName } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documents = await db.document.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        fileName: true,
        fileSize: true,
        contentType: true,
        vectorized: true,
        extractionStage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chats: true,
            exams: true,
          },
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let documentId: string | null = null

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userDocumentsCount = await db.document.count({
      where: { userId: session.user.id },
    })
    if (userDocumentsCount >= 5 && session.user.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Free users can only upload up to 5 documents' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Basic validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Quick PDF validation
    if (buffer.subarray(0, 4).toString() !== '%PDF') {
      return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 400 })
    }

    const safeFileName = sanitizeFileName(file.name)
    const docName = safeFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    const fileData = buffer.toString('base64')

    // Create document
    const document = await db.document.create({
      data: {
        name: docName,
        fileName: safeFileName,
        fileSize: buffer.length,
        contentType: file.type,
        userId: session.user.id,
        vectorized: false,
        content: "",
        fileData,
      }
    })

    documentId = document.id

    // Start processing immediately since global SSE is already established
    setTimeout(async () => {
      try {
        console.log(`Starting direct document processing for ${documentId}`);
        await documentProcessor.processAndStoreDocument(
          buffer,
          safeFileName,
          session.user.id,
          document.id
        )
        console.log(`Direct document processing completed for ${documentId}`);
      } catch (error) {
        console.error(`Direct document processing failed for ${documentId}:`, error);
      }
    }, 500); // Short delay to ensure upload response is sent first

    return NextResponse.json({
      document: {
        ...document,
        fileData: undefined,
      },
      status: 'queued'
    }, { status: 201 })

  } catch (error) {
    // Clean up document if it was created
    if (documentId) {
      try {
        await db.document.delete({ where: { id: documentId } })
      } catch (cleanupError) {
        console.error('Failed to cleanup document after error:', cleanupError)
      }
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Delete document
    const document = await db.document.findFirst({
      where: { id: documentId, userId: session.user.id }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await documentProcessor.deleteDocument(documentId as string, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
