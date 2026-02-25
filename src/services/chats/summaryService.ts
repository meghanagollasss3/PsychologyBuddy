import { DatabaseService } from '@/src/lib/database/database-service'
import { AIService } from '@/src/lib/ai/ai-service'
import { ValidationError } from '@/src/lib/errors/custom-errors'

export interface SummaryGenerationData {
  sessionId: string
  conversation: any[]
  studentId: string
}

export interface StructuredSummaryResponse {
  id: string
  mainTopic: string
  conversationStart: string
  conversationAbout: string
  reflection: string
  createdAt: Date
  sessionId: string
}

export class SummaryService {
  /**
   * Generate a structured summary for a chat session
   */
  static async generateSummary(summaryData: SummaryGenerationData): Promise<StructuredSummaryResponse> {
    try {
      console.log('[SummaryService] Starting summary generation for session:', summaryData.sessionId);
      
      // Verify session exists and belongs to student
      const session = await DatabaseService.getChatSession(summaryData.sessionId, summaryData.studentId)
      
      if (!session) {
        console.error('[SummaryService] Session not found:', summaryData.sessionId);
        throw new ValidationError('Session not found')
      }
      
      console.log('[SummaryService] Session verified, generating AI summary...');
      
      // Generate AI structured summary
      const aiSummary = await AIService.generateStructuredSummary(summaryData.conversation)
      
      console.log('[SummaryService] AI summary generated:', aiSummary);
      
      console.log('[SummaryService] Creating database record...');
      // Create summary in database
      const summary = await DatabaseService.createStructuredSummary({
        sessionId: summaryData.sessionId,
        studentId: summaryData.studentId,
        mainTopic: aiSummary.mainTopic,
        conversationStart: aiSummary.conversationStart,
        conversationAbout: aiSummary.conversationAbout,
        reflection: aiSummary.reflection
      })
      
      console.log('[SummaryService] Database record created:', summary);
      
      return {
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }
    } catch (error) {
      console.error('[SummaryService] Error in generateSummary:', error);
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get summary for a specific session
   */
  static async getSessionSummary(sessionId: string, studentId?: string): Promise<StructuredSummaryResponse | null> {
    try {
      const summary = await DatabaseService.getStructuredSummaryBySession(sessionId)
      
      if (!summary) {
        return null
      }
      
      // If studentId is provided, verify ownership
      if (studentId) {
        const session = await DatabaseService.getChatSession(sessionId, studentId)
        if (!session) {
          throw new ValidationError('Session not found or access denied')
        }
      }
      
      return {
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to get session summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all summaries for a student
   */
  static async getStudentSummaries(studentId: string, limit: number = 20): Promise<StructuredSummaryResponse[]> {
    try {
      const summaries = await DatabaseService.getStudentStructuredSummaries(studentId, limit)
      
      return summaries.map(summary => ({
        id: summary.id,
        mainTopic: summary.mainTopic,
        conversationStart: summary.conversationStart,
        conversationAbout: summary.conversationAbout,
        reflection: summary.reflection,
        createdAt: summary.createdAt,
        sessionId: summary.sessionId
      }))
    } catch (error) {
      throw new Error(`Failed to get student summaries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get recent summary for a student
   */
  static async getRecentSummary(studentId: string): Promise<StructuredSummaryResponse | null> {
    try {
      const summaries = await this.getStudentSummaries(studentId, 1)
      return summaries.length > 0 ? summaries[0] : null
    } catch (error) {
      throw new Error(`Failed to get recent summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a summary
   */
  static async deleteSummary(summaryId: string, studentId: string): Promise<void> {
    try {
      // Get summary to verify ownership
      const summary = await DatabaseService.getStructuredSummaryById(summaryId)
      
      if (!summary) {
        throw new ValidationError('Summary not found')
      }
      
      // Verify the summary belongs to the student
      const session = await DatabaseService.getChatSession(summary.sessionId, studentId)
      if (!session) {
        throw new ValidationError('Access denied')
      }
      
      // Note: We would need to implement deleteStructuredSummary in DatabaseService
      // For now, this is a placeholder
      throw new Error('Delete functionality not yet implemented for new summary format')
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new Error(`Failed to delete summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
