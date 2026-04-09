import { ConversationAnalyzer, ConversationAnalysis, Message } from '../conversation-analysis';

export interface ChatTerminationResult {
  shouldTerminate: boolean;
  reason: string;
  analysis: ConversationAnalysis;
  closingMessage?: string;
}

export class AutomaticChatTermination {
  private static terminationCheckInterval = 3000; // Check every 3 seconds after 10 messages
  private static minMessagesForAnalysis = 5; // Increased to prevent early termination
  private static terminationThreshold = 70; // Production threshold
  private static maxSessionDuration = Number(process.env.CHAT_SESSION_DURATION_MINUTES || 720) * 60 * 1000; // Configurable: default 15 minutes
  private static warningTime = Number(process.env.CHAT_WARNING_TIME_MINUTES || 1) * 60 * 1000; // Configurable: default 3 minutes

  /**
   * Configure session duration settings
   */
  static configureSessionDuration(maxDurationMinutes: number, warningTimeMinutes: number) {
    AutomaticChatTermination.maxSessionDuration = maxDurationMinutes * 60 * 1000;
    AutomaticChatTermination.warningTime = warningTimeMinutes * 60 * 1000;
    console.log(`[AutoTermination] Session duration configured: ${maxDurationMinutes}min max, ${warningTimeMinutes}min warning`);
  }

  /**
   * Get current configuration
   */
  static getConfiguration() {
    return {
      maxSessionDurationMinutes: AutomaticChatTermination.maxSessionDuration / 60 / 1000,
      warningTimeMinutes: AutomaticChatTermination.warningTime / 60 / 1000,
      terminationCheckInterval: AutomaticChatTermination.terminationCheckInterval,
      minMessagesForAnalysis: AutomaticChatTermination.minMessagesForAnalysis,
      terminationThreshold: AutomaticChatTermination.terminationThreshold
    };
  }

  /**
   * Analyzes conversation and determines if it should be automatically terminated
   */
  static async shouldTerminateChat(
    messages: Message[],
    sessionId: string,
    sessionStartTime?: number
  ): Promise<ChatTerminationResult> {
    console.log(`[AutoTermination] Analyzing conversation with ${messages.length} messages for session ${sessionId}`);
    
    // Check time-based termination first (this should run regardless of message count)
    if (sessionStartTime) {
      const currentTime = Date.now();
      const sessionDuration = currentTime - sessionStartTime;
      
      console.log(`[AutoTermination] Session duration: ${Math.round(sessionDuration / 1000)}s, max: ${Math.round(AutomaticChatTermination.maxSessionDuration / 1000)}s`);
      
      // Force termination if session exceeds max duration
      if (sessionDuration >= AutomaticChatTermination.maxSessionDuration) {
        console.log(`[AutoTermination] TIME LIMIT REACHED - Terminating session`);
        return {
          shouldTerminate: true,
          reason: 'Time limit reached',
          analysis: {
            shouldEnd: true,
            reason: 'Session time limit exceeded',
            completionScore: 100,
            nextSteps: [],
            emotionalProgress: { improvement: false },
            conversationQuality: { depth: 'moderate', engagement: 'medium', resolution: 'partial' }
          },
          closingMessage: "I've enjoyed our conversation and will generate a summary for you to review later. Take care!"
        };
      }
      
      // Check if we should show a warning (2 minutes before end)
      if (sessionDuration >= (AutomaticChatTermination.maxSessionDuration - AutomaticChatTermination.warningTime)) {
        console.log(`[AutoTermination] Time warning threshold reached`);
        // We don't terminate here, just log for potential UI warning
      }
    }
    
    // Only analyze conversation if we have enough messages (but time-based checks already done above)
    if (messages.length < AutomaticChatTermination.minMessagesForAnalysis) {
      console.log(`[AutoTermination] Too few messages for conversation analysis (${messages.length} < ${AutomaticChatTermination.minMessagesForAnalysis}), but time checks already performed`);
      return {
        shouldTerminate: false,
        reason: 'Conversation too short for analysis',
        analysis: {
          shouldEnd: false,
          reason: 'Too short',
          completionScore: 0,
          nextSteps: [],
          emotionalProgress: { improvement: false },
          conversationQuality: { depth: 'shallow', engagement: 'low', resolution: 'none' }
        }
      };
    }

    console.log(`[AutoTermination] Proceeding with normal analysis`);
    
    try {
      const analysis = await ConversationAnalyzer.analyzeConversation(messages, sessionId);
      console.log(`[AutoTermination] Analysis result:`, {
        shouldEnd: analysis.shouldEnd,
        reason: analysis.reason,
        completionScore: analysis.completionScore
      });
      
      // Generate appropriate closing message if termination is recommended
      const closingMessage = analysis.shouldEnd ? this.generateClosingMessage(analysis) : undefined;

      return {
        shouldTerminate: analysis.shouldEnd,
        reason: analysis.reason,
        analysis,
        closingMessage,
      };
    } catch (error) {
      console.error(`[AutoTermination] Error in conversation analysis:`, error);
      return {
        shouldTerminate: false,
        reason: 'Analysis error',
        analysis: {
          shouldEnd: false,
          reason: 'Error',
          completionScore: 0,
          nextSteps: [],
          emotionalProgress: { improvement: false },
          conversationQuality: { depth: 'shallow', engagement: 'low', resolution: 'none' }
        }
      };
    }
  }

  /**
   * Generates a natural closing message based on conversation analysis
   */
  private static generateClosingMessage(analysis: ConversationAnalysis): string {
    const { reason, emotionalProgress, conversationQuality } = analysis;

    // Base closing messages
    const baseClosings = [
      "I'm really glad we could talk today. ",
      "It's been meaningful to connect with you. ",
      "Thank you for sharing this with me. ",
      "I appreciate your openness in our conversation. "
    ];

    // Progress-specific additions
    const progressAdditions = [];
    if (emotionalProgress.improvement) {
      progressAdditions.push("I can see you've made some real progress, and that's wonderful to see. ");
    }
    if (conversationQuality.resolution === 'complete') {
      progressAdditions.push("You seem to have found some clarity and direction. ");
    } else if (conversationQuality.resolution === 'partial') {
      progressAdditions.push("You've taken some important steps forward. ");
    }

    // Forward-looking encouragement
    const encouragements = [
      "Remember to be gentle with yourself as you process this. ",
      "Trust in your ability to handle what comes next. ",
      "You have more strength than you realize. ",
      "Take care of yourself and know I'm here if you need to talk again. "
    ];

    // Combine elements naturally
    const baseClosing = baseClosings[Math.floor(Math.random() * baseClosings.length)];
    const progressAddition = progressAdditions.length > 0 
      ? progressAdditions[Math.floor(Math.random() * progressAdditions.length)]
      : '';
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    return `${baseClosing}${progressAddition}${encouragement}`;
  }

  /**
   * Sets up automatic termination checking for a chat session
   */
  static setupTerminationCheck(
    getMessages: () => Message[],
    sessionId: string,
    onTerminate: (result: ChatTerminationResult) => void,
    sessionStartTime?: number,
    intervalMs: number = AutomaticChatTermination.terminationCheckInterval
  ): () => void {
    const intervalId = `interval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[AutoTermination] Setting up new interval ${intervalId} for session ${sessionId}`);
    console.log(`[AutoTermination] Session start time: ${sessionStartTime ? new Date(sessionStartTime).toISOString() : 'not provided'}`);
    console.log(`[AutoTermination] Max session duration: ${AutomaticChatTermination.maxSessionDuration / 1000}s`);
    
    let checkCount = 0;
    const maxChecks = 1000; // Increased to allow for longer sessions (5 minutes * 20 checks per minute = 100 checks for 5min session)

    const interval = setInterval(async () => {
      checkCount++;
      
      console.log(`[AutoTermination] === INTERVAL CHECK #${checkCount} (${intervalId}) ===`);
      
      try {
        // Get fresh messages on each check
        const currentMessages = getMessages();
        
        console.log(`[AutoTermination] Check #${checkCount}: ${currentMessages.length} messages`);
        
        // Always perform time-based checks if session start time is available
        if (sessionStartTime) {
          console.log(`[AutoTermination] Performing time-based check`);
          const currentTime = Date.now();
          const sessionDuration = currentTime - sessionStartTime;
          console.log(`[AutoTermination] Current session duration: ${Math.round(sessionDuration / 1000)}s`);
        } else {
          console.log(`[AutoTermination] No session start time provided - skipping time-based checks`);
        }
        
        // Only do conversation analysis if we have enough messages
        if (currentMessages.length < AutomaticChatTermination.minMessagesForAnalysis) {
          console.log(`[AutoTermination] Skipping conversation analysis - not enough messages, but time checks still performed`);
          
          // Still check time-based termination even with few messages
          if (sessionStartTime) {
            const result = await AutomaticChatTermination.shouldTerminateChat(currentMessages, sessionId, sessionStartTime);
            if (result.shouldTerminate) {
              console.log(`[AutoTermination] Time-based termination triggered`);
              clearInterval(interval);
              setTimeout(() => {
                onTerminate(result);
              }, 0);
              return;
            }
          }
          
          return;
        }
        
        console.log(`[AutoTermination] Proceeding with full analysis for ${currentMessages.length} messages`);
        
        const result = await AutomaticChatTermination.shouldTerminateChat(currentMessages, sessionId, sessionStartTime);
        
        console.log(`[AutoTermination] Termination decision: ${result.shouldTerminate}`);
        
        if (result.shouldTerminate || checkCount >= maxChecks) {
          console.log(`[AutoTermination] Clearing interval ${intervalId} and stopping monitoring`);
          clearInterval(interval); // Clear interval immediately
          
          if (result.shouldTerminate) {
            console.log(`[AutoTermination] Triggering termination: ${result.reason}`);
            // Use setTimeout to avoid blocking the interval cleanup
            setTimeout(() => {
              console.log(`[AutoTermination] Executing termination callback for ${intervalId}`);
              onTerminate(result);
            }, 0);
          } else {
            console.log(`[AutoTermination] Max checks reached, stopping monitoring for ${intervalId}`);
          }
        }
      } catch (error) {
        console.error(`[AutoTermination] Error in interval ${intervalId}:`, error);
        clearInterval(interval); // Clear interval on error too
      }
    }, intervalMs);

    // Return cleanup function
    console.log(`[AutoTermination] Returning cleanup function for interval ${intervalId}`);
    return () => {
      console.log(`[AutoTermination] Cleanup called for interval ${intervalId}`);
      clearInterval(interval);
    };
  }

  /**
   * Gets the remaining time for a session
   */
  static getRemainingSessionTime(sessionStartTime: number): number {
    const currentTime = Date.now();
    const elapsed = currentTime - sessionStartTime;
    return Math.max(0, AutomaticChatTermination.maxSessionDuration - elapsed);
  }

  /**
   * Checks if session should show time warning
   */
  static shouldShowTimeWarning(sessionStartTime: number): boolean {
    const remaining = AutomaticChatTermination.getRemainingSessionTime(sessionStartTime);
    return remaining > 0 && remaining <= AutomaticChatTermination.warningTime;
  }

  /**
   * Gets session duration in seconds
   */
  static getSessionDuration(sessionStartTime: number): number {
    return Math.round((Date.now() - sessionStartTime) / 1000);
  }

  /**
   * Checks if conversation has natural ending indicators
   */
  static hasNaturalEndingIndicators(messages: Message[]): boolean {
    const recentMessages = messages.slice(-3);
    const lastUserMessage = messages.filter(m => m.sender === 'student').pop();
    
    if (!lastUserMessage) return false;

    const naturalEndings = [
      'thank you for listening',
      'i feel better now',
      'this really helped',
      'i think i understand now',
      'goodbye',
      'take care',
      'thanks for everything',
      'i appreciate this',
      'feel more hopeful',
      'know what to do now'
    ];

    return naturalEndings.some(ending => 
      lastUserMessage.content.toLowerCase().includes(ending)
    );
  }

  /**
   * Checks if conversation has reached natural conclusion
   */
  static hasReachedNaturalConclusion(messages: Message[]): boolean {
    const userMessages = messages.filter(m => m.sender === 'student');
    const botMessages = messages.filter(m => m.sender === 'bot');
    
    // Need at least 5 exchanges
    if (userMessages.length < 5 || botMessages.length < 5) {
      return false;
    }

    // Check if last few exchanges show resolution
    const lastExchanges = messages.slice(-6); // Last 3 exchanges
    
    // Look for patterns indicating resolution
    const resolutionPatterns = [
      /that makes sense/i,
      /i understand/i,
      /that helps/i,
      /feel better/i,
      /thank you/i,
      /appreciate/i
    ];

    return lastExchanges.some(msg => 
      resolutionPatterns.some(pattern => pattern.test(msg.content))
    );
  }
}
