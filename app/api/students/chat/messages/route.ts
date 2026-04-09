import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Fetch the chat session to get start time
    const chatSession = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch all messages for this session
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        content: true,
        senderType: true,
        createdAt: true,
      },
    });

    // Format messages for the summary API
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.senderType === 'STUDENT' ? 'user' : 'assistant',
      timestamp: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      session: {
        id: chatSession.id,
        startedAt: chatSession.startedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
