import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/core/document-processor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import { getToken } from 'next-auth/jwt';
import db from '@/lib/config/db';

interface ProgressEvent {
  documentId: string;
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
}

interface ErrorEvent {
  documentId: string;
  error: string;
}

interface CompleteEvent {
  documentId: string;
}

// Store user-specific controllers
const userClients = new Map<string, ReadableStreamDefaultController>();

// Listen to document processor events globally
documentProcessor.on('progress', async (data: ProgressEvent) => {
  const document = await db.document.findUnique({ where: { id: data.documentId }, select: { userId: true } });
  if (document && userClients.has(document.userId)) {
    const controller = userClients.get(document.userId);
    const eventMessage = `data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`;
    controller?.enqueue(new TextEncoder().encode(eventMessage));
  }
});

documentProcessor.on('complete', async (data: CompleteEvent) => {
  const document = await db.document.findUnique({ where: { id: data.documentId }, select: { userId: true } });
  if (document && userClients.has(document.userId)) {
    const controller = userClients.get(document.userId);
    const eventMessage = `data: ${JSON.stringify({ type: 'complete', ...data, timestamp: new Date() })}\n\n`;
    controller?.enqueue(new TextEncoder().encode(eventMessage));
  }
});

documentProcessor.on('error', async (data: ErrorEvent) => {
  const document = await db.document.findUnique({ where: { id: data.documentId }, select: { userId: true } });
  if (document && userClients.has(document.userId)) {
    const controller = userClients.get(document.userId);
    const eventMessage = `data: ${JSON.stringify({ type: 'error', ...data, timestamp: new Date() })}\n\n`;
    controller?.enqueue(new TextEncoder().encode(eventMessage));
  }
});


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const token = await getToken({ req: request });
      if (token?.sub) {
        userId = token.sub;
      }
    }
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const stream = new ReadableStream({
      start(controller) {
        console.log(`SSE connection established for user ${userId}`);
        userClients.set(userId, controller);

        const initialMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'SSE connection established',
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initialMessage));

        request.signal.addEventListener('abort', () => {
          console.log(`SSE connection closed for user ${userId}`);
          userClients.delete(userId);
          controller.close();
        });
      }
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('SSE Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 