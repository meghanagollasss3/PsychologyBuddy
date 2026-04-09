import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const DEFAULT_MODEL = 'gpt-3.5-turbo'

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not configured - AI features will be disabled')
}

// Types for AI operations
export interface ChatSummary {
  summary: string
  mood: string
  topics: string[]
}

export interface StructuredSummary {
  mainTopic: string
  conversationStart: string
  conversationAbout: string
  reflection: string
}

export interface AIConfig {
  model?: string
  temperature?: number
  maxTokens?: number
}

// AI Service class with error handling
export class AIService {
  private static model = openai(DEFAULT_MODEL)
  
  private static validateConfig() {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
  }
  
  private static createSystemPrompt(context?: string): string {
    const basePrompt = "You are a warm, supportive, teenage-friendly mental health companion for Psychology Buddy. Be validating, empathetic, and ask gentle follow-up questions. Do not give medical advice."
    return context ? `${basePrompt} ${context}` : basePrompt
  }
  
  static async generateOpeningMessage(lastSummary?: any, config: AIConfig = {}): Promise<string> {
    try {
      this.validateConfig()
      
      let contextPrompt = this.createSystemPrompt()
      
      if (lastSummary) {
        contextPrompt += ` The student's last conversation was about: ${lastSummary.summary}. They were feeling ${lastSummary.mood}.`
      }
      
      contextPrompt += " Start with an empathetic opening message. Be warm, validating, and ask gentle follow-up questions."
      
      const { text } = await generateText({
        model: this.model,
        prompt: contextPrompt,
        temperature: config.temperature || 0.7
      })
      
      return text
    } catch (error) {
      console.error('Error generating opening message:', error)
      throw new Error('Failed to generate opening message')
    }
  }
  
  static async generateChatResponse(message: string, config: AIConfig = {}): Promise<Response> {
    try {
      this.validateConfig()
      
      const result = await streamText({
        model: this.model,
        system: this.createSystemPrompt("Keep responses concise and conversational."),
        prompt: `Student message: "${message}". Respond supportively.`,
        temperature: config.temperature || 0.7
      })
      
      return result.toTextStreamResponse()
    } catch (error) {
      console.error('Error generating chat response:', error)
      throw new Error('Failed to generate chat response')
    }
  }
  
  static async generateStructuredSummary(conversation: any[], config: AIConfig = {}): Promise<StructuredSummary> {
    try {
      this.validateConfig()
      
      // Format conversation as transcript
      const conversationText = conversation
        .map(msg => {
          const role = msg.role === 'user' ? 'Student' : 'Buddy'
          return `${role}: ${msg.content}`
        })
        .join('\n')
      
      const prompt = `You are analyzing a therapy chat session between a student and Buddy (AI mental health companion). Based on the following conversation transcript, generate a structured JSON summary.

Conversation Transcript:
${conversationText}

Generate a JSON response with exactly these 4 fields:
{
  "mainTopic": "The primary concern or topic the student wanted to discuss",
  "conversationStart": "How the conversation actually began - what the student said first and how Buddy responded",
  "conversationAbout": "The main discussion points and themes that emerged during the conversation between student and Buddy",
  "reflection": "A thoughtful reflection on the conversation's emotional journey, key insights gained, and how the student's understanding evolved"
}

Requirements:
- mainTopic: Focus on what the student actually wanted help with (2-6 words)
- conversationStart: Describe the actual opening exchange and initial concern (1-2 sentences)
- conversationAbout: Capture the real dialogue flow and key discussion points between both student and Buddy (2-3 sentences)
- reflection: Provide empathetic insight about the emotional journey and understanding gained (2-3 sentences)

Important: Analyze the ACTUAL conversation between student and Buddy, not just generic themes. Capture how the discussion evolved, what insights were shared, and the emotional progression.

Respond ONLY with valid JSON. No additional text, explanations, or formatting.`
      
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: config.temperature || 0.3
      })
      
      try {
        // Clean the response to ensure it's valid JSON
        const cleanText = text.trim().replace(/```json\n?|\n?```/g, '')
        return JSON.parse(cleanText) as StructuredSummary
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        console.error('Raw response:', text)
        
        // Fallback response if parsing fails
        return {
          mainTopic: "General Conversation",
          conversationStart: "The conversation began with the student sharing their thoughts.",
          conversationAbout: "The discussion covered various personal topics and feelings.",
          reflection: "This was a meaningful conversation that provided space for self-expression."
        }
      }
    } catch (error) {
      console.error('Error generating structured summary:', error)
      throw new Error('Failed to generate structured summary')
    }
  }

  static async generateSummary(conversation: any[], config: AIConfig = {}): Promise<ChatSummary> {
    try {
      this.validateConfig()
      
      const conversationText = conversation
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      const prompt = `Analyze this conversation and generate a summary in JSON format:
${conversationText}

Return JSON with:
- summary: string (brief summary of the conversation)
- mood: string (the emotional tone of the conversation)
- topics: string[] (list of main topics discussed)

Respond only with valid JSON, no other text.`
      
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: config.temperature || 0.3
      })
      
      try {
        return JSON.parse(text) as ChatSummary
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        console.error('Raw response:', text)
        throw new Error('Failed to parse AI response')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      throw new Error('Failed to generate summary')
    }
  }
  
  // Health check method
  static async healthCheck(): Promise<boolean> {
    try {
      this.validateConfig()
      
      await generateText({
        model: this.model,
        prompt: 'Hello'
      })
      
      return true
    } catch (error) {
      console.error('AI service health check failed:', error)
      return false
    }
  }
  
  // Get configuration status
  static getConfigStatus(): { configured: boolean; model: string } {
    return {
      configured: !!OPENAI_API_KEY,
      model: DEFAULT_MODEL
    }
  }
}

// Export individual methods for backward compatibility
export const generateOpeningMessage = AIService.generateOpeningMessage.bind(AIService)
export const generateChatResponse = AIService.generateChatResponse.bind(AIService)
export const generateSummary = AIService.generateSummary.bind(AIService)
