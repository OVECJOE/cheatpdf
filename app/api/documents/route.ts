import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import { DocumentExtractionStage, SubscriptionStatus } from '@prisma/client'
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

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
        content: "",
        fileData: buffer.toString('base64')
      },
    })

    fetch('/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: document.id,
        userId: session.user.id
      })
    }).catch(error => {
      console.error('Failed to trigger background processing:', error)
      documentProcessor.deleteDocument(document.id, session.user.id)
    })

    return NextResponse.json({
      document: {
        ...document,
        fileData: undefined
      },
      status: 'processing'
    }, { status: 201 })

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
