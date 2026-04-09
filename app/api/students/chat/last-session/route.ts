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
      console.log('Looking for last session for student:', studentId)
      
      // Get the most recent summary to find the last session
      const recentSummary = await DatabaseService.getRecentSummary(studentId)
      console.log('Recent summary found:', recentSummary)
      
      if (!recentSummary) {
        console.log('No recent summary found, checking for any chat sessions...')
        
        // Fallback: Try to get any recent chat session directly
        console.log('No recent summary found, checking for any chat sessions...')
        const recentSessions = await DatabaseService.getStudentChatSessions(studentId, 1)
        console.log('Recent sessions query result:', recentSessions)
        console.log('Sessions length:', recentSessions?.length || 0)
        
        if (recentSessions.length === 0) {
          return {
            success: true,
            data: null
          }
        }
        
        // Use the most recent session even without summary
        const lastSession = recentSessions[0]
        console.log('Using last session without summary:', lastSession)
        
        // Get messages for this session
        const messages = await DatabaseService.getChatMessages(lastSession.id)
        console.log('Messages found for session:', messages?.length || 0)
        
        return {
          success: true,
          data: {
            sessionId: lastSession.id,
            id: lastSession.id,
            mainTopic: 'Previous Conversation',
            conversationAbout: 'Continuing from last chat session',
            reflection: 'No summary available for this session',
            createdAt: lastSession.startedAt.toISOString(),
            messages: messages || [],
            sessionStartedAt: lastSession.startedAt
          }
        }
      }
      
      // Get the full chat session details
      const chatSession = await DatabaseService.getChatSession(recentSummary.sessionId, studentId)
      console.log('Chat session found:', chatSession)
      
      if (!chatSession) {
        return {
          success: true,
          data: null
        }
      }
      
      // Get all messages for this session
      const messages = await DatabaseService.getChatMessages(recentSummary.sessionId)
      console.log('Messages found:', messages?.length || 0)
      
      return {
        success: true,
        data: {
          sessionId: recentSummary.sessionId,
          id: recentSummary.id,
          mainTopic: recentSummary.mainTopic,
          conversationAbout: recentSummary.conversationAbout,
          reflection: recentSummary.reflection,
          createdAt: recentSummary.createdAt.toISOString(),
          messages: messages || [],
          sessionStartedAt: chatSession.startedAt
        }
      }
    } catch (error) {
      console.error('Error getting last session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get last session'
      }
    }
  },
  { requireAuth: false } // Adjust based on your auth needs
)
