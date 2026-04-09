import { createAPIHandler } from '@/src/lib/api'
import { DatabaseService } from '@/src/lib/database/database-service'

export const dynamic = 'force-dynamic'

export const GET = createAPIHandler.get(
  async (params, context) => {
    const studentId = params.get('studentId')
    
    if (!studentId) {
      throw new Error('Student ID is required')
    }
    
    try {
      console.log('=== DEBUG: Checking database for student:', studentId)
      
      // Check summaries first
      const summaries = await DatabaseService.getStudentStructuredSummaries(studentId, 5)
      console.log('=== DEBUG: Summaries found:', summaries.length, summaries)
      
      // Check chat sessions
      const sessions = await DatabaseService.getStudentChatSessions(studentId, 10)
      console.log('=== DEBUG: Chat sessions found:', sessions.length, sessions)
      
      // Check chat messages
      let totalMessages = 0
      for (const session of sessions) {
        const messages = await DatabaseService.getChatMessages(session.id)
        totalMessages += messages?.length || 0
        console.log(`=== DEBUG: Session ${session.id} has ${messages?.length || 0} messages`)
      }
      
      return {
        success: true,
        data: {
          studentId,
          summariesCount: summaries.length,
          sessionsCount: sessions.length,
          totalMessages,
          debug: {
            summaries: summaries.map(s => ({ id: s.id, mainTopic: s.mainTopic, createdAt: s.createdAt })),
            sessions: sessions.map(s => ({ id: s.id, startedAt: s.startedAt, messageCount: 0 })),
          }
        }
      }
    } catch (error) {
      console.error('Debug error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Debug query failed'
      }
    }
  },
  { requireAuth: false }
)
