import { useState, useEffect } from 'react'

export interface LastSessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface LastSessionData {
  sessionId: string
  id: string // Add missing id field for compatibility
  mainTopic: string
  conversationAbout?: string
  reflection?: string
  createdAt: string
  messages: LastSessionMessage[]
  sessionStartedAt: string
}

export interface UseChatSummaryOptions {
  studentId: string
}

export function useChatSummary({ studentId }: UseChatSummaryOptions) {
  const [lastSession, setLastSession] = useState<LastSessionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLastSession = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/students/chat/last-session?studentId=${studentId}`)
      const data = await response.json()
      
      console.log('Last session API response:', data)
      
      if (data.success && data.data) {
        const sessionData = data.data
        console.log('Full session data:', sessionData)
        
        setLastSession(sessionData)
      } else {
        console.log('No session data found:', data)
        setLastSession(null)
      }
    } catch (err) {
      console.error('Error fetching last session:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchLastSession()
    }
  }, [studentId])

  const importLastSession = () => {
    console.log('importLastSession called, lastSession:', lastSession)
    
    if (!lastSession) {
      console.log('No last session found')
      return ''
    }
    
    const topic = lastSession.mainTopic || 'our previous conversation'
    console.log('Using topic:', topic)
    
    return `I want to continue talking about: ${topic}`
  }

  const getLastSessionMessages = () => {
    console.log('getLastSessionMessages called - lastSession:', lastSession)
    if (!lastSession?.messages) {
      console.log('No lastSession or messages found')
      return []
    }
    
    console.log('Converting messages:', lastSession.messages)
    // Convert database messages to chat format
    const convertedMessages = lastSession.messages.map(msg => ({
      id: msg.id,
      sender: (msg.role === 'user' ? 'student' : 'bot') as "student" | "bot",
      content: msg.content,
      timestamp: msg.timestamp,
      type: 'normal' as const
    }))
    console.log('Converted messages:', convertedMessages)
    return convertedMessages
  }

  return {
    lastSession,
    loading,
    error,
    fetchLastSession,
    importLastSession,
    getLastSessionMessages
  }
}
