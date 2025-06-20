import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/core/document-processor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import { getToken } from 'next-auth/jwt';
import { getDocumentUser, allDocumentUserEntries, unregisterDocumentUser } from './ud-map';
import { getStageDisplayName } from '@/lib/utils';

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

// Store user-specific controllers and document-to-user mappings
const userClients = new Map<string, ReadableStreamDefaultController>();

// Helper function to safely send SSE message
const sendSSEMessage = (controller: ReadableStreamDefaultController, data: Record<string, unknown>) => {
  try {
    const eventMessage = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(eventMessage));
  } catch (error) {
    console.error('Failed to send SSE message:', error);
  }
};

// Listen to document processor events globally
documentProcessor.on('progress', async (data: ProgressEvent) => {
  const userId = getDocumentUser(data.documentId);
  
  if (userId && userClients.has(userId)) {
    const controller = userClients.get(userId);
    if (controller) {
      const eventData = {
        type: 'progress',
        documentId: data.documentId,
        stage: data.stage,
        progress: Math.round(data.progress),
        message: data.message || getStageDisplayName(data.stage),
        timestamp: data.timestamp || new Date()
      };
      
      sendSSEMessage(controller, eventData);
    }
  }
});

documentProcessor.on('complete', async (data: CompleteEvent) => {
  const userId = getDocumentUser(data.documentId);
  
  if (userId && userClients.has(userId)) {
    const controller = userClients.get(userId);
    if (controller) {
      const eventData = {
        type: 'complete',
        documentId: data.documentId,
        message: 'Document processing completed successfully',
        timestamp: new Date()
      };
      
      sendSSEMessage(controller, eventData);
    }
  }
  
  // Clean up the mapping after completion
  unregisterDocumentUser(data.documentId);
});

documentProcessor.on('error', async (data: ErrorEvent) => {
  const userId = getDocumentUser(data.documentId);
  
  if (userId && userClients.has(userId)) {
    const controller = userClients.get(userId);
    if (controller) {
      const eventData = {
        type: 'error',
        documentId: data.documentId,
        error: data.error || 'Processing failed',
        timestamp: new Date()
      };
      
      sendSSEMessage(controller, eventData);
    }
  }
  
  // Clean up the mapping after error
  unregisterDocumentUser(data.documentId);
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    };

    const stream = new ReadableStream({
      start(controller) {
        console.log(`SSE connection established for user ${userId}`);
        userClients.set(userId, controller);

        // Send initial connection message
        const initialMessage = {
          type: 'connected',
          message: 'SSE connection established',
          timestamp: new Date().toISOString()
        };
        
        sendSSEMessage(controller, initialMessage);

        // Send periodic heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (userClients.has(userId)) {
            const heartbeatMessage = {
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            };
            sendSSEMessage(controller, heartbeatMessage);
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 30000); // Send heartbeat every 30 seconds

        // Handle connection close
        let isCleanedUp = false;
        const cleanup = () => {
          if (isCleanedUp) {
            return; // Prevent multiple cleanup calls
          }
          isCleanedUp = true;
          
          console.log(`SSE connection closed for user ${userId}`);
          clearInterval(heartbeatInterval);
          userClients.delete(userId);
          
          // Clean up any document mappings for this user
          for (const [docId, mappedUserId] of allDocumentUserEntries()) {
            if (mappedUserId === userId) {
              unregisterDocumentUser(docId);
            }
          }
          
          try {
            if (!controller.desiredSize) {
              controller.close();
            }
          } catch (error) {
            console.error('Error closing SSE controller:', error);
          }
        };

        // Listen for connection abort/close
        request.signal.addEventListener('abort', cleanup);
        
        // Additional cleanup for various close scenarios
        const checkConnection = setInterval(() => {
          if (request.signal.aborted && !isCleanedUp) {
            clearInterval(checkConnection);
            cleanup();
          }
        }, 5000);
      },
      
      cancel() {
        console.log(`SSE stream cancelled for user ${userId}`);
        userClients.delete(userId);
      }
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('SSE Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}