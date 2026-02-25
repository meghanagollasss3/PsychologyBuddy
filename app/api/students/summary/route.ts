import { createAPIHandler } from '@/src/lib/api'
import { SummaryService } from '@/src/services/chats'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export const GET = createAPIHandler.get(
  async (params, context) => {
    const sessionId = params.get('sessionId')
    
    if (sessionId) {
      // For specific session, get studentId from the session
      const prisma = await import('@/src/prisma').then(m => m.default);
      
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { userId: true }
      });
      
      if (!session) {
        throw new Error('Session not found')
      }
      
      const summary = await SummaryService.getSessionSummary(sessionId, session.userId)
      
      if (!summary) {
        throw new Error('Summary not found')
      }
      
      // Convert to SummaryModal format
      return {
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection
      }
    } else {
      // For all summaries, we need a studentId - for now, return empty or require a parameter
      const studentId = params.get('studentId')
      
      if (!studentId) {
        throw new Error('Student ID is required for getting all summaries')
      }
      
      const summaries = await SummaryService.getStudentSummaries(studentId)
      
      // Convert to Reflection format with all summary fields
      return NextResponse.json({
        success: true,
        data: summaries.map(summary => ({
          id: summary.id,
          title: summary.mainTopic,
          content: summary.reflection,
          mood: 'Neutral', // You might want to store mood in the summary
          createdAt: summary.createdAt.toISOString(),
          topics: [summary.mainTopic],
          messageCount: 0, // You might want to count messages
          sessionId: summary.sessionId,
          // Include all the original summary fields for proper display
          mainTopic: summary.mainTopic,
          conversationStart: summary.conversationStart,
          conversationAbout: summary.conversationAbout,
          reflection: summary.reflection
        }))
      })
    }
  },
  { requireAuth: false } // Disable auth for now
)