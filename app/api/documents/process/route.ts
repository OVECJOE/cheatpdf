import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import { DocumentExtractionStage } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, userId } = await request.json()
    if (!documentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const document = await db.document.findFirst({
      where: { 
        id: documentId, 
        userId,
        extractionStage: DocumentExtractionStage.PENDING 
      }
    })

    if (!document || !document.fileData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const buffer = Buffer.from(document.fileData, 'base64')
    await db.document.update({
      where: { id: documentId },
      data: { extractionStage: DocumentExtractionStage.PDF_PARSE }
    })

    await documentProcessor.processAndStoreDocument(
      buffer,
      document.fileName,
      userId,
      documentId
    )

    await db.document.update({
      where: { id: documentId },
      data: { 
        fileData: null,
        vectorized: true 
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    const { documentId } = await request.json().catch(() => ({}))
    if (documentId) {
      await db.document.update({
        where: { id: documentId },
        data: {
          extractionStage: DocumentExtractionStage.FAILED,
          content: `Processing failed: ${(error as Error).message}`,
          fileData: null
        },
      }).catch(console.error)
    }

    return NextResponse.json(
      { error: 'Processing failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}