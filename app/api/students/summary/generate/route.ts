import { NextRequest, NextResponse } from 'next/server'
import { SummaryService } from '@/src/services/chats/summaryService'
import { DatabaseService } from '@/src/lib/database/database-service'
import { z } from 'zod'
import prisma from '@/src/prisma'

// Validation schema
const GenerateSummarySchema = z.object({
  sessionId: z.string(),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  }))
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let requestBody;
    try {
      requestBody = await request.json()
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { sessionId, conversation } = requestBody

    console.log('Summary generate request:', { sessionId, conversationLength: conversation?.length })

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = GenerateSummarySchema.safeParse({ sessionId, conversation })
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    // Get studentId from the session - we need to extract this from the chat session
    
    try {
      // First get the chat session to find the studentId
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      });
      
      if (!chatSession) {
        return NextResponse.json(
          { success: false, error: 'Chat session not found' },
          { status: 404 }
        );
      }
      
      const studentId = chatSession.userId;

      // Verify session belongs to the student (additional security check)
      const sessionVerification = await DatabaseService.getChatSession(sessionId, studentId);
      if (!sessionVerification) {
        return NextResponse.json(
          { success: false, error: 'Session access denied' },
          { status: 403 }
        );
      }

      // Generate summary
      const summary = await SummaryService.generateSummary({
        sessionId,
        conversation,
        studentId
      })

      return NextResponse.json({
        success: true,
        data: {
          id: summary.id,
          title: summary.mainTopic,
          content: summary.reflection,
          mood: 'Neutral',
          createdAt: summary.createdAt.toISOString(),
          topics: [summary.mainTopic],
          messageCount: conversation.length,
          sessionId: sessionId
        }
      })

    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Failed to get session information' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating summary:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary' 
      },
      { status: 500 }
    )
  }
}