import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/config/auth';
import { documentProcessor } from '@/lib/core/document-processor';
import db from '@/lib/config/db';

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.fileData) {
      return NextResponse.json({ error: 'Document file data not found' }, { status: 400 });
    }

    // Start processing asynchronously
    const buffer = Buffer.from(document.fileData, 'base64');
    
    // Process in background
    documentProcessor.processAndStoreDocument(
      buffer,
      document.fileName,
      session.user.id,
      id
    ).catch(error => {
      console.error(`Document processing failed for ${id}:`, error);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Document processing started' 
    });

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to start document processing' },
      { status: 500 }
    );
  }
} 