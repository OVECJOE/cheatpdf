import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/config/auth'
import { chatService } from '@/lib/services/chat'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (chatId) {
      // Get specific chat history
      const chat = await chatService.getChatHistory(chatId, session.user.id)
      return NextResponse.json({ chat })
    } else {
      // Get all user chats
      const chats = await chatService.getUserChats(session.user.id)
      return NextResponse.json({ chats })
    }
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
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

    const body = await request.json()
    const { action, chatId, documentId, title, message } = body

    if (action === 'create') {
      // Create new chat
      if (!documentId || !title) {
        return NextResponse.json(
          { error: 'Document ID and title are required' },
          { status: 400 }
        )
      }

      const chat = await chatService.create(
        session.user.id,
        documentId,
        title
      )

      return NextResponse.json({ chat }, { status: 201 })
    }

    if (action === 'message') {
      // Send message
      if (!chatId || !message) {
        return NextResponse.json(
          { error: 'Chat ID and message are required' },
          { status: 400 }
        )
      }

      const response = await chatService.sendMessage(
        chatId,
        message,
        session.user.id
      )

      return NextResponse.json({ response })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling chat request:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
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
    const chatId = searchParams.get('id')

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    await chatService.deleteChat(chatId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}
