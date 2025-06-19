import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { documentProcessor } from '@/lib/core/document-processor'
import db from '@/lib/config/db'
import Busboy from 'busboy'
import { Readable } from 'stream'

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

async function handleBusboyUpload(request: NextRequest, userId: string): Promise<Response> {
  return new Promise((resolve) => {
    const busboy = Busboy({
      headers: headersToObject(request.headers),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    })
    const fileBuffer: Buffer[] = []
    let fileName = ''
    let fileType = ''
    let fileSize = 0
    let fileFieldFound = false

    busboy.on('file', (file: NodeJS.ReadableStream, filename: string, mimetype: string) => {
      fileFieldFound = true
      fileName = filename
      fileType = mimetype
      file.on('data', (data: Buffer) => {
        fileBuffer.push(data)
        fileSize += data.length
        if (fileSize > 100 * 1024 * 1024) {
          file.resume()
          busboy.emit('error', new Error('File size exceeds 100MB limit'))
        }
      })
      file.on('limit', () => {
        busboy.emit('error', new Error('File size exceeds 100MB limit'))
      })
    })

    busboy.on('finish', async () => {
      if (!fileFieldFound) {
        resolve(NextResponse.json({ error: 'No file uploaded' }, { status: 400 }))
        return
      }
      const buffer = Buffer.concat(fileBuffer)
      try {
        const document = await documentProcessor.processAndStoreDocument(
          buffer,
          fileName,
          userId,
          fileType
        )
        resolve(NextResponse.json({ document }, { status: 201 }))
      } catch (error) {
        resolve(NextResponse.json(
          { error: (error as Error).message },
          { status: 400 }
        ))
      }
    })

    busboy.on('error', (err: Error) => {
      resolve(NextResponse.json({ error: err.message }, { status: 400 }))
    })

    if (request.body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = Readable.fromWeb(request.body as any)
      stream.pipe(busboy)
    } else {
      resolve(NextResponse.json({ error: 'No request body' }, { status: 400 }))
    }
  })
}

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

    // Move Busboy logic to a helper function
    const response = await handleBusboyUpload(request, session.user.id)
    return response
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
