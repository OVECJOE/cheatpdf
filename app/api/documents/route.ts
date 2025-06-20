import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import { registerDocumentUser } from './events/ud-map'
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
    console.error('GET /api/documents error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch documents' },
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

    // Check document limit for free users
    const userDocumentsCount = await db.document.count({
      where: { userId: session.user.id },
    })
    
    if (userDocumentsCount >= 5 && session.user.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Free users can only upload up to 5 documents. Upgrade to premium for unlimited uploads.' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // File validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ 
        error: 'Only PDF files are supported. Please upload a PDF document.' 
      }, { status: 400 })
    }

    const maxSize = 100 * 1024 * 1024 // 100MB limit
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size exceeds 100MB limit. Your file is ${Math.round(file.size / (1024 * 1024))}MB.` 
      }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Read and validate file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Quick PDF validation
    if (buffer.subarray(0, 4).toString() !== '%PDF') {
      return NextResponse.json({ 
        error: 'File is not a valid PDF. Please ensure you are uploading a proper PDF document.' 
      }, { status: 400 })
    }

    // Prepare file data
    const safeFileName = sanitizeFileName(file.name)
    const docName = safeFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    const fileData = buffer.toString('base64')

    // Create document record
    const document = await db.document.create({
      data: {
        name: docName,
        fileName: safeFileName,
        fileSize: buffer.length,
        contentType: file.type || 'application/pdf',
        userId: session.user.id,
        vectorized: false,
        content: "",
        fileData,
      }
    })

    documentId = document.id

    // Register document-user mapping for SSE events
    registerDocumentUser(document.id, session.user.id)
    documentProcessor.processAndStoreDocument(
      buffer,
      safeFileName,
      session.user.id,
      document.id
    )

    // Return success response immediately
    return NextResponse.json({
      document: {
        ...document,
        fileData: undefined, // Don't send base64 data back to client
      },
      status: 'queued',
      message: 'Document uploaded successfully and queued for processing'
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/documents error:', error);
    
    // Clean up document if it was created
    if (documentId) {
      try {
        await db.document.delete({ where: { id: documentId } })
        console.log(`Cleaned up failed document ${documentId}`)
      } catch (cleanupError) {
        console.error('Failed to cleanup document after error:', cleanupError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to upload document'
    return NextResponse.json(
      { error: errorMessage },
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

    // Verify document exists and user has access
    const document = await db.document.findFirst({
      where: { 
        id: documentId, 
        userId: session.user.id 
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found or access denied' 
      }, { status: 404 })
    }

    // Delete document (includes vector store cleanup)
    await documentProcessor.deleteDocument(documentId, session.user.id)

    return NextResponse.json({ 
      success: true,
      message: 'Document deleted successfully'
    })
    
  } catch (error) {
    console.error('DELETE /api/documents error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete document'
    
    return NextResponse.json(
      { error: `Failed to delete document: ${errorMessage}` },
      { status: 500 }
    )
  }
}