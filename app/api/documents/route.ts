import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import { DocumentExtractionStage } from '@prisma/client'
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chats: true,
            exams: true,
          },
        },
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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only 5 documents allowed for free users
    const userDocumentsCount = await db.document.count({
      where: { userId: session.user.id },
    })
    if (userDocumentsCount >= 5 && session.user.subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Free users can only upload up to 5 documents' },
        { status: 403 }
      )
    }

    // Use Next.js built-in formData() for file uploads
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File type is not PDF' }, { status: 400 })
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create initial document record
    const safeFileName = sanitizeFileName(file.name)
    const document = await db.document.create({
      data: {
        name: safeFileName.replace(/\.[^/.]+$/, ''),
        fileName: safeFileName,
        fileSize: buffer.length,
        contentType: file.type,
        userId: session.user.id,
        vectorized: false,
        extractionStage: DocumentExtractionStage.PENDING,
        content: ""
      },
    })

    // Process document with timeout protection
    const processWithTimeout = async () => {
      try {
        // Set a timeout for processing (8 seconds to stay within Vercel limits)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Processing timeout')), 8000)
        })

        const processPromise = documentProcessor.processAndStoreDocument(
          buffer,
          safeFileName,
          session.user.id,
          document.id
        )

        // Race between processing and timeout
        await Promise.race([processPromise, timeoutPromise])
        console.log(`Document ${document.id} processed successfully`)
      } catch (error) {
        console.error(`Document processing failed for ${document.id}:`, error)
        
        // Update document status to failed
        await db.document.update({
          where: { id: document.id },
          data: {
            extractionStage: DocumentExtractionStage.FAILED,
            content: `Processing failed: ${(error as Error).message}`,
          },
        })
      }
    }

    processWithTimeout()
    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document: ' + (error as Error).message },
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

    await documentProcessor.deleteDocument(documentId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
