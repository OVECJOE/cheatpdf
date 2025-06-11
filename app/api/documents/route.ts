import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'

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
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
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

    // Only 3 documents allowed for free users
    const userDocumentsCount = await db.document.count({
      where: { userId: session.user.id },
    })
    if (userDocumentsCount >= 5) {
      return NextResponse.json(
        { error: 'Free users can only upload up to 5 documents' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const document = await documentProcessor.processAndStoreDocument(
      fileBuffer,
      file.name,
      session.user.id,
      file.type
    )

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
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
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
