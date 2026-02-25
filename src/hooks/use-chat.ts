import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChatAPI } from '../lib/ai/chat-api'
import { ConversationAnalyzer } from '../services/conversation-analysis'
import { AutomaticChatTermination, ChatTerminationResult } from '../services/chats/automatic-chat-termination'
import { ResponseFormatter, StructuredResponse } from '../lib/ai/response-templates'
import { ContentEscalationDetector } from '../services/escalations/content-escalation-detector'
import { EscalationAlertService } from '../services/escalations/escalation-alert-service'

export interface Message {
  id: string
  sender: "student" | "bot"
  content: string
  timestamp: string
  temp?: boolean
  type?: 'opening' | 'closing' | 'normal'
  importSuggestion?: {
    show: boolean
    lastTopic?: string
    lastDate?: string
  }
}

export interface ChatState {
  messages: Message[]
  input: string
  isLoading: boolean
  sessionId: string | null
  sessionStartTime: number | null
  escalationAlert?: {
    id: string
    category: string
    level: string
    severity: number
    requiresImmediateAction: boolean
    recommendation: string
  }
}

export interface UseChatOptions {
  studentId: string
  mood?: string
  triggers?: string[]
  notes?: string
  onMessage?: (message: Message) => void
  onError?: (error: Error) => void
  onEscalation?: (escalation: ChatState['escalationAlert']) => void
  importData?: { mainTopic?: string; sessionId?: string }
}

export function useChat({
  studentId,
  mood,
  triggers,
  notes,
  onMessage,
  onError,
  onEscalation,
  importData,
}: UseChatOptions) {
  const router = useRouter();
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    input: '',
    isLoading: false,
    sessionId: null,
    sessionStartTime: null
  })

  const chatRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)
  const terminationCleanupRef = useRef<(() => void) | null>(null)
  const isTerminatingRef = useRef(false)

  // Auto scroll when messages update
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [state.messages]);

  // Debug: Log state changes
  useEffect(() => {
    console.log(`[AutoTermination] State changed: sessionId=${state.sessionId}, sessionStartTime=${state.sessionStartTime}, messages=${state.messages.length}`);
  }, [state.sessionId, state.sessionStartTime, state.messages]);

  // Initialize chat session
  const initializeChat = useCallback(async (
    mood?: string, 
    triggers?: string[], 
    notes?: string,
    skipImportSuggestion: boolean = false,
    importData?: { mainTopic?: string; sessionId?: string }
  ) => {
    if (!studentId) {
      console.warn('Cannot initialize chat: No student ID provided')
      return
    }
    
    if (isInitialized.current) {
      console.log('Chat already initialized')
      return
    }
    
    isInitialized.current = true
    
    try {
      console.log('Initializing chat with:', { studentId, mood, triggers, notes, skipImportSuggestion, importData });
      
      // Create a temporary session ID for the opening message
      // The actual session will only be created when student sends first message
      const tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionIdRef.current = tempSessionId
      setState(prev => ({ ...prev, sessionId: tempSessionId }))
      
      // Generate simple opening message
      let openingMessageContent = "Hello! I'm here to listen and support you. How are you feeling today?"
      
      if (importData && importData.mainTopic) {
        openingMessageContent = `Welcome back! I see we were discussing ${importData.mainTopic} before. How would you like to continue our conversation?`
      }

      // Display opening message
      const openingMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'bot',
        content: openingMessageContent,
        timestamp: new Date().toISOString(),
        type: 'opening'
      }
      
      console.log('Opening message created locally:', openingMessage)

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, openingMessage]
      }))

      onMessage?.(openingMessage)

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize chat')
      onError?.(err)
      // Reset flag on error so it can be retried
      isInitialized.current = false
    }
  }, [studentId, onMessage, onError, importData])

  // Generate summary and end chat
  const generateSummaryAndEndChat = useCallback(async () => {
    if (!sessionIdRef.current || !studentId) return;

    console.log(`[AutoTermination] Starting summary generation for session ${sessionIdRef.current}`);
    console.log(`[AutoTermination] Message count: ${state.messages.length}`);

    try {
      const requestPayload = {
        sessionId: sessionIdRef.current,
        conversation: state.messages.map((msg: Message) => ({
          role: msg.sender === "student" ? "user" : "assistant",
          content: msg.content
        })),
      };
      
      console.log(`[AutoTermination] Request payload:`, requestPayload);
      console.log(`[AutoTermination] Student ID: ${studentId}`);

      // Call summary generation API
      const response = await fetch("/api/students/summary/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": studentId
        },
        body: JSON.stringify(requestPayload),
      });

      console.log(`[AutoTermination] Summary API response status: ${response.status}`);

      const data = await response.json();
      console.log(`[AutoTermination] Summary API response:`, data);
      console.log(`[AutoTermination] Response data type:`, typeof data);
      console.log(`[AutoTermination] Response data keys:`, Object.keys(data));

      if (data && data.success) {
        // Store for last-session preview use
        sessionStorage.setItem("lastSummaryId", data.data.id);
        console.log(`[AutoTermination] Summary generated successfully, ID: ${data.data.id}`);
        
        // Instead of redirecting to summary page, start a new chat session
        console.log(`[AutoTermination] Starting new chat session after summary generation`);
        
        // Clear current session
        sessionStorage.removeItem("chatSessionId");
        sessionIdRef.current = null;
        sessionStartTimeRef.current = null;
        isInitialized.current = false;
        isTerminatingRef.current = false;
        
        // Reset state for new chat
        setState({
          messages: [],
          input: '',
          isLoading: false,
          sessionId: null,
          sessionStartTime: null
        });
        
        // Initialize new chat session
        await initializeChat();
        
      } else {
        console.error(`[AutoTermination] Summary generation failed:`, data);
        isTerminatingRef.current = false;
      }
    } catch (error) {
      console.error('Failed to generate summary during automatic termination:', error);
      isTerminatingRef.current = false;
    }
  }, [state.messages, studentId, initializeChat]);

  // Automatic chat termination logic
  const handleAutomaticTermination = useCallback(async (result: ChatTerminationResult) => {
    if (isTerminatingRef.current || !sessionIdRef.current) return;
    
    isTerminatingRef.current = true;
    console.log('Automatic chat termination triggered:', result.reason);
    
    try {
      // Add closing message from AI
      if (result.closingMessage) {
        console.log(`[AutoTermination] Adding closing message: ${result.closingMessage}`);
        const closingMessage: Message = {
          id: `closing_${Date.now()}`,
          sender: 'bot',
          content: result.closingMessage,
          timestamp: new Date().toISOString(),
          type: 'closing'
        };
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, closingMessage]
        }));
      }

      // Wait a moment for user to read the closing message
      console.log(`[AutoTermination] Waiting 3 seconds before generating summary...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log(`[AutoTermination] Proceeding with summary generation...`);
      // Generate summary and end chat
      await generateSummaryAndEndChat();
      
      // Wait a moment after summary generation to ensure it's stored before redirecting
      console.log(`[AutoTermination] Waiting 2 seconds after summary generation...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to reflections page to show the new summary
      console.log(`[AutoTermination] Redirecting to reflections page...`);
      router.push('/students/reflections');
      
    } catch (error) {
      console.error('Error during automatic termination:', error);
      isTerminatingRef.current = false;
    }
  }, [generateSummaryAndEndChat]);

  // Set up automatic termination monitoring
  useEffect(() => {
    console.log(`[AutoTermination] useEffect triggered! sessionId=${state.sessionId}, sessionStartTime=${state.sessionStartTime}`);
    
    const currentSessionId = state.sessionId;
    const messageCount = state.messages.length;
    const sessionStartTime = state.sessionStartTime;
    
    console.log(`[AutoTermination] Setting up monitoring: sessionId=${currentSessionId}, messageCount=${messageCount}, sessionStartTime=${sessionStartTime ? new Date(sessionStartTime).toISOString() : 'null'}`);
    
    if (!currentSessionId) {
      console.log(`[AutoTermination] No session ID, skipping monitoring setup`);
      return; // Only need a valid session ID for time-based monitoring
    }

    // Clean up any existing termination check
    if (terminationCleanupRef.current) {
      console.log(`[AutoTermination] Cleaning up previous interval before setting up new one`);
      terminationCleanupRef.current();
      terminationCleanupRef.current = null;
    }

    console.log(`[AutoTermination] Starting termination monitoring for ${messageCount} messages (time-based checks enabled)`);

    // Set up new termination check with a function that returns current messages
    terminationCleanupRef.current = AutomaticChatTermination.setupTerminationCheck(
      () => state.messages, // Pass a function to get current messages
      currentSessionId,
      handleAutomaticTermination, // Use the stable callback directly
      sessionStartTime || undefined
    );

    console.log(`[AutoTermination] Monitoring setup complete`);

    return () => {
      if (terminationCleanupRef.current) {
        console.log(`[AutoTermination] Effect cleanup - cleaning up termination monitoring`);
        terminationCleanupRef.current();
        terminationCleanupRef.current = null;
      }
    };
  }, [state.sessionId, state.sessionStartTime]); // Only depend on session changes, not messages or callback

  // Send message with streaming
  const sendMessage = useCallback(async (messageText: string) => {
    console.log(`[AutoTermination] sendMessage called with: "${messageText}"`);
    console.log(`[AutoTermination] Current state before sending: sessionId=${state.sessionId}, sessionStartTime=${state.sessionStartTime}`);
    
    if (!messageText.trim()) {
      console.log('Cannot send message: empty message')
      return
    }

    // Check if this is the first message (temp session)
    const isFirstMessage = sessionIdRef.current?.startsWith('temp_')
    console.log(`[AutoTermination] Is first message? ${isFirstMessage}, current sessionIdRef: ${sessionIdRef.current}`);
    
    if (isFirstMessage) {
      console.log('First message detected, creating actual chat session...')
      
      try {
        // Create the actual session with the student's first message
        const data = await ChatAPI.startChat({
          studentId,
          mood: mood && mood.trim() ? mood : undefined,
          triggers: triggers && triggers.length > 0 ? triggers : undefined,
          notes: notes && notes.trim() ? notes : undefined,
          skipImportSuggestion: false,
          importData
        })

        console.log('Chat session created successfully:', data);

        // Update session ID
        sessionIdRef.current = data.sessionId
        console.log(`[AutoTermination] About to update state sessionId to: ${data.sessionId}`);
        setState(prev => {
          console.log(`[AutoTermination] State update - prev sessionId: ${prev.sessionId}, new sessionId: ${data.sessionId}`);
          return { ...prev, sessionId: data.sessionId }
        })
        
        // Set session start time for time-based termination
        if (!sessionStartTimeRef.current) {
          sessionStartTimeRef.current = Date.now()
          console.log(`[AutoTermination] About to update state sessionStartTime to: ${sessionStartTimeRef.current}`);
          setState(prev => {
            console.log(`[AutoTermination] State update - prev sessionStartTime: ${prev.sessionStartTime}, new sessionStartTime: ${sessionStartTimeRef.current}`);
            return { ...prev, sessionStartTime: sessionStartTimeRef.current }
          })
          console.log('Session start time set:', new Date(sessionStartTimeRef.current).toISOString())
        }
        
        // Save the real session ID
        sessionStorage.setItem("chatSessionId", data.sessionId)
        
      } catch (error) {
        console.error('Failed to create chat session:', error)
        onError?.(error as Error)
        setState(prev => ({ ...prev, isLoading: false }))
        return // Stop execution if session creation fails
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "student",
      content: messageText,
      timestamp: new Date().toLocaleTimeString(),
    }

    // Add user message immediately
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      input: '',
      isLoading: true
    }))

    onMessage?.(userMessage)

    // Check for escalation indicators in the student's message
    console.log('[EscalationCheck] Analyzing message for escalation indicators');
    try {
      // Get conversation context for better analysis
      const conversationContext = state.messages
        .slice(-5) // Last 5 messages for context
        .map(msg => msg.content);

      // Analyze the message for escalation indicators
      const detection = await ContentEscalationDetector.analyzeMessage(
        messageText,
        studentId,
        sessionIdRef.current || 'unknown',
        conversationContext
      );

      console.log('[EscalationCheck] Detection result:', {
        isEscalation: detection.isEscalation,
        category: detection.category.type,
        level: detection.level.level,
        severity: detection.level.severity,
        confidence: detection.category.confidence
      });

      // If this is a valid escalation, create an alert and update state
      if (ContentEscalationDetector.isValidEscalation(detection)) {
        console.log('[EscalationCheck] Valid escalation detected, creating alert');
        
        try {
          // Create alert through API (this will be handled by the chat stream route too)
          const response = await fetch('/api/students/escalations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': studentId
            },
            body: JSON.stringify({
              message: messageText,
              studentId,
              sessionId: sessionIdRef.current
            })
          });

          if (response.ok) {
            const alertData = await response.json();
            console.log('[EscalationCheck] Alert created successfully:', alertData.alert?.id);
            
            if (alertData.escalationDetected && alertData.alert) {
              const escalationAlert = {
                id: alertData.alert.id,
                category: alertData.alert.category,
                level: alertData.alert.level,
                severity: alertData.alert.severity,
                requiresImmediateAction: alertData.alert.requiresImmediateAction,
                recommendation: alertData.alert.recommendation
              };

              // Update state with escalation alert
              setState(prev => ({ ...prev, escalationAlert: escalationAlert }));
              
              // Call escalation callback
              onEscalation?.(escalationAlert);
              
              console.log('[EscalationCheck] Escalation alert set in state and callback triggered');
            }
          } else {
            console.error('[EscalationCheck] Failed to create escalation alert:', response.status);
          }
        } catch (error) {
          console.error('[EscalationCheck] Error creating escalation alert:', error);
          // Don't fail the chat request if alert creation fails
        }
      }
    } catch (error) {
      console.error('[EscalationCheck] Error in escalation detection:', error);
      // Don't fail the chat request if escalation detection fails
    }

    try {
      // Validate required fields before sending request
      if (!sessionIdRef.current) {
        throw new Error('No active session found')
      }
      
      if (!studentId) {
        throw new Error('Student ID is required')
      }
      
      if (!messageText || messageText.trim() === '') {
        throw new Error('Message cannot be empty')
      }

      const requestBody = {
        sessionId: sessionIdRef.current,
        studentId: studentId,
        message: messageText
      }
      
      console.log('Sending chat request:', requestBody)
      
      const response = await fetch('/api/students/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': studentId
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Chat API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`HTTP error! status: ${response.status}${errorData.error ? ` - ${errorData.error}` : ''}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let botReply = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          botReply += decoder.decode(value)

          // Update streaming temporary message
          setState(prev => {
            const withoutTemp = prev.messages.filter(m => m.id !== "temp-bot")
            return {
              ...prev,
              messages: [
                ...withoutTemp,
                {
                  id: "temp-bot",
                  sender: "bot",
                  content: botReply,
                  timestamp: new Date().toLocaleTimeString(),
                  temp: true,
                },
              ]
            }
          })
        }
      }

      // Finalize the bot message
      setState(prev => {
        const withoutTemp = prev.messages.filter(m => m.id !== "temp-bot")
        return {
          ...prev,
          messages: [
            ...withoutTemp,
            {
              id: crypto.randomUUID(),
              sender: "bot",
              content: botReply,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]
        }
      })

      onMessage?.(userMessage)

    } catch (error) {
      console.error('Failed to send message:', error)
      onError?.(error as Error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [studentId, sessionIdRef, mood, triggers, notes, onMessage, onError, onEscalation, importData, state.messages])

  // End chat session and clean up
  const endChat = useCallback(async () => {
    try {
      if (sessionIdRef.current) {
        // Mark session as inactive in database
        await fetch(`/api/students/chat/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': studentId
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current
          })
        })
      }

      // Clean up local state
      sessionStorage.removeItem("chatSessionId")
      sessionIdRef.current = null
      sessionStartTimeRef.current = null
      isInitialized.current = false
      
      setState(prev => ({ ...prev, sessionId: null, isLoading: false }))
      
    } catch (error) {
      console.error('Failed to end chat:', error)
      onError?.(error as Error)
    }
  }, [studentId, onError])

  // Fetch existing messages for a session
  const fetchExistingMessages = useCallback(async (sessionId: string) => {
    try {
      console.log(`[AutoTermination] Fetching existing messages for session: ${sessionId}`);
      const response = await fetch(`/api/students/chat/messages?sessionId=${sessionId}`, {
        headers: {
          'x-user-id': studentId
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          const formattedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            sender: msg.role === 'user' ? 'student' : 'bot',
            content: msg.content,
            timestamp: msg.timestamp,
            type: 'normal'
          }))
          
          setState(prev => ({ ...prev, messages: formattedMessages }))
          
          // Set session start time for existing sessions (use current time minus 1 minute)
          if (!sessionStartTimeRef.current && !state.sessionStartTime) {
            const startTime = Date.now() - (1 * 60 * 1000); // Assume session started 1 minute ago
            sessionStartTimeRef.current = startTime
            setState(prev => ({ ...prev, sessionStartTime: startTime }))
            console.log(`[AutoTermination] Session start time set for existing session: ${new Date(startTime).toISOString()}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing messages:', error)
    }
  }, [studentId, state.sessionStartTime])

  // Initialize chat on mount
  useEffect(() => {
    if (!isInitialized.current && studentId) {
      // Check for existing session
      const savedSessionId = sessionStorage.getItem("chatSessionId")
      
      if (savedSessionId && !savedSessionId.startsWith('temp_')) {
        // Continue existing session
        sessionIdRef.current = savedSessionId
        setState(prev => ({ ...prev, sessionId: savedSessionId }))
        isInitialized.current = true
        console.log('Continuing existing chat session:', savedSessionId)
        
        // Set session start time for existing session (use current time minus 1 minute)
        const startTime = Date.now() - (1 * 60 * 1000); // Assume session started 1 minute ago
        sessionStartTimeRef.current = startTime
        setState(prev => ({ ...prev, sessionStartTime: startTime }))
        console.log(`[AutoTermination] Session start time set for existing session: ${new Date(startTime).toISOString()}`);
        
        // Fetch existing messages for this session
        fetchExistingMessages(savedSessionId)
      } else {
        // Create new temporary session (no database record yet)
        console.log('No existing session, creating temporary one');
        initializeChat(mood, triggers, notes, false, importData)
      }
    }
  }, [studentId, mood, triggers, notes, fetchExistingMessages, initializeChat, importData])

  const setInput = useCallback((newInput: string) => {
    setState(prev => ({ ...prev, input: newInput }))
  }, [])

  return {
    ...state,
    chatRef,
    sendMessage,
    setInput,
    initializeChat,
    endChat,
  }
}