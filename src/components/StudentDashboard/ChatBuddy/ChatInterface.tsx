"use client";
import { X, Sparkles, Lightbulb, Shield, ArrowUpRight } from "lucide-react";

import React, { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useChat, useChatSummary, useServerAuth, useChatAccess } from "@/src/hooks";
import { Message } from '@/src/hooks/use-chat';
import { NavigationUtils } from "@/src/utils";
import { FullPageLoading } from "@/components/ui/LoadingSpinner";
import { AuthError } from "@/components/ui/ErrorMessage";
import BackToDashboard from "../Layout/BackToDashboard";
import ReactMarkdown from 'react-markdown';

// Format timestamp to show only hours and minutes
const formatTime = (timestamp: string) => {
  try {
    // Handle different timestamp formats
    let date: Date;
    
    if (timestamp.includes('T')) {
      // ISO format: 2024-03-07T18:30:00.000Z
      date = new Date(timestamp);
    } else if (timestamp.includes(':')) {
      // Time format: 18:30:00
      const today = new Date();
      const [hours, minutes, seconds] = timestamp.split(':');
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                    parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
    } else {
      // Fallback - treat as ISO or try direct parsing
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Invalid Date';
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.warn('Timestamp parsing error:', error, 'for:', timestamp);
    return 'Invalid Date';
  }
};

// Types
interface ChatMessageData {
  id: string;
  sender: "student" | "bot";
  content: string;
  timestamp: string;
  type?: 'opening' | 'closing' | 'normal';
  importSuggestion?: {
    show: boolean;
    lastTopic?: string;
    lastDate?: string;
  };
}

interface ChatInterfaceProps {
  studentId?: string;
  moodCheckinId?: string;
  triggerId?: string;
  mood?: string;
  triggers?: string[];
  notes?: string;
}

const DEFAULT_QUICK_REPLIES = [
  "I'm feeling anxious",
  "I need help with stress",
  "I'm feeling sad",
];

// Chat Message Component
function ChatMessage({ 
  message, 
  onImportLastConversation,
  lastSession,
  showSummaryImport,
  isImportingFromReflections,
  onDismissSummary
}: { 
  message: ChatMessageData; 
  onImportLastConversation?: (topic?: string) => void;
  lastSession?: { mainTopic: string; id: string };
  showSummaryImport?: boolean;
  isImportingFromReflections?: boolean;
  onDismissSummary?: () => void;
}) {
  const isBot = message.sender === 'bot';
  const isStudent = message.sender === 'student';
  const [handleImportClick] = useState(() => () => {
    if (message.importSuggestion?.lastTopic) {
      onImportLastConversation?.(message.importSuggestion.lastTopic);
    }
  });

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 sm:mb-6`}>
      {isBot && (
        <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[65%]`}>
          {/* Logo and Label - Mobile Only */}
          <div className="mb-1 sm:hidden">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </span>
            <span className="inline-block align-middle text-[11px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-1">
              Psychology Buddy
            </span>
          </div>
          
          {/* Logo and Label on Same Line - Desktop Only */}
          <div className="mb-1 hidden sm:block">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </span>
            <span className="inline-block align-middle text-[13px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-2">
              Psychology Buddy
            </span>
          </div>
          
          {/* Message Bubble */}
          <div
            className={`px-3 py-2 sm:px-4 sm:py-3 rounded-[24px] bg-[#F2F8FD] text-gray-800 rounded-tl-sm relative`}
          >
            {/* The "Friend" Accent - a soft blue line on the left */}
            
            
            <div className="text-gray-800 ml-2">
              <ReactMarkdown
                components={{
                  // Custom paragraph styling without typography plugin
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[13px] sm:text-[15px]">{children}</p>,
                  br: () => <br className="block h-4" />, // Add space between paragraphs
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* Legacy Import Suggestion UI (for backward compatibility) */}
          {message.importSuggestion?.show && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-2">
                I see we talked about {message.importSuggestion.lastTopic} in our last session on {new Date(message.importSuggestion.lastDate || '').toLocaleDateString()}. Would you like to continue that conversation?
              </p>
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Continue Previous Conversation
              </button>
            </div>
          )}
          
          {/* Timestamp */}
          <span className="text-[10px] sm:text-[11px] text-gray-400 mt-1 px-1 block">
            {formatTime(message.timestamp)}
          </span>
          
          {/* Import Suggestion UI for opening messages - Outside bubble */}
          {message.type === 'opening' && lastSession && showSummaryImport && !isImportingFromReflections && (
            <div className="mt-2">
              <LastSummaryImport
                mainTopic={lastSession.mainTopic}
                onImport={() => onImportLastConversation?.()}
                onDismiss={onDismissSummary || (() => {})}
              />
            </div>
          )}
        </div>
      )}
      
      {isStudent && (
        <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[65%] text-right`}>
          {/* Message Bubble */}
          <div
            className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-[#0A77C2] to-[#65B7F0] text-white rounded-tr-sm`}
          >
            <p className="text-[13px] sm:text-[15px] leading-relaxed break-words">{message.content}</p>
          </div>
          
          {/* Timestamp */}
          <span className="text-[10px] sm:text-[11px] text-gray-400 mt-1 px-1 block">
            {formatTime(message.timestamp)}
          </span>
        </div>
      )}
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3 justify-start mb-4 sm:mb-6">
      <div className=" text-gray-600 rounded-2xl rounded-tl-sm flex items-center">
        <Image 
          src="/Logo.png" 
          alt="Buddy Logo" 
          width={20} 
          height={20} 
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain animate-bounce"
        />
      </div>
    </div>
  );
}

// Chat Input Component
function ChatInput({ 
  input, 
  onInputChange, 
  onSend, 
  disabled = false,
  placeholder = "Type your message…" 
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-15 py-3 sm:py-4 bg-white border-t border-[#f8f8f8]">
      <div className="flex gap-2 sm:gap-3 items-center">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 sm:px-4 sm:py-3 md:px-9 md:py-2 sm:w-[731px] sm:h-[65px] border-[1px] border-[#d4d4d4] rounded-full bg-[#fbfbfb] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#1B9EE0] focus:ring-1 focus:ring-[#1B9EE0] disabled:opacity-50 text-[12px] sm:text-[13px] md:text-[15px] min-w-0"
        />
        <Button
          onClick={onSend}
          disabled={disabled || !input.trim()}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-[61px] md:h-[61px] bg-gradient-to-r from-[#206894] to-[#36AFFA] hover:bg-[#1688bf] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          size="icon"
        >
          <Image src="/Icons/Vector.png" alt="Send" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"></Image>
        </Button>
      </div>
    </div>
  );
}

// Exercise Suggestions Component (as bot message)
function ExerciseSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  onDismiss 
}: { 
  suggestions: any[];
  onSuggestionClick: (suggestion: any) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-2 max-w-[85%] sm:max-w-[75%]">
        {/* <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B9EE0] to-[#4FC3F7] flex items-center justify-center flex-shrink-0">
          <Image
            src="/Logo.png"
            alt="Psychology Buddy"
            width={20}
            height={20}
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
          />
        </div> */}
        
        <div className="flex-1">
          <div className="mb-1 sm:hidden">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={16}
                height={16}
                className="w-4 h-4"
              />
            </span>
            <span className="inline-block align-middle text-[11px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-1">
              Psychology Buddy
            </span>
          </div>
          
          {/* Logo and Label on Same Line - Desktop Only */}
          <div className="mb-1 hidden sm:block">
            <span className="inline-block align-middle">
              <Image 
                src="/Logo.png" 
                alt="Psychology Buddy Logo" 
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </span>
            <span className="inline-block align-middle text-[13px] font-semibold bg-gradient-to-r from-[#206894] to-[#36AFFA] bg-clip-text text-transparent ml-2">
              Psychology Buddy
            </span>
          </div>
          
          <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[24px] bg-[#F2F8FD] text-gray-800 rounded-tl-sm">
            <div className="text-[13px] sm:text-[15px] leading-relaxed break-words">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#2F3D43] mb-2">Try these exercises</h3>
                <p className="text-xs text-gray-600">
                  Based on our conversation, these exercises might help you feel better:
                </p>
              </div>
              
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[#2F3D43] px-2 bg-[#D5E4EF] w-[25px] h-[25px] rounded-full font-medium">{index + 1}</span>
                    <button
                      onClick={() => onSuggestionClick(suggestion)}
                      className="text-[16px] text-[#1B9EE0] hover:text-blue-800 underline font-medium flex items-center gap-1"
                    >
                      {suggestion.title}
                      {/* <span>→</span> */}
                      <ArrowUpRight className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Replies Component
function QuickReplies({ 
  replies, 
  onReplyClick, 
  className = "" 
}: {
  replies: string[];
  onReplyClick: (reply: string) => void;
  className?: string;
}) {
  if (!replies.length) return null;

  return (
    <div className={`px-3 sm:px-4 lg:px-15 py-2 sm:py-3 bg-white ${className}`}>
      <div className="text-xs font-medium text-gray-500 mb-1 sm:mb-2">Quick replies:</div>
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
        {replies.map((reply) => (
          <button
            key={reply}
            onClick={() => onReplyClick(reply)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-full text-[11px] sm:text-[13px] text-gray-700 hover:bg-gray-50 hover:border-gray-300 whitespace-nowrap transition-colors flex-shrink-0"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}

// Last Summary Import Component
function LastSummaryImport({ 
  mainTopic, 
  onImport, 
  onDismiss 
}: { 
  mainTopic: string; 
  onImport: () => void; 
  onDismiss: () => void;
}) {
  return (
    <div className="w-[250px] h-[87px] sm:w-[289px] sm:h-[87px] mx-1 sm:mx-1 lg:mx-1 my-3 sm:my-4 p-3 sm:p-3 bg-[#F2F8FD] rounded-[12px]">
      <div className="flex flex-col gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] sm:text-[14px] font-medium text-[#767676] -mb-1 sm:-mb-1">Related context available:</p>
    
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onImport}
            className="w-[160px] h-[29px] sm:w-[180px] sm:h-[29px] text-[#F38414] rounded-full border-[1px] border-[#FFE1C3] text-[10px] sm:text-[12px] font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF8E1C]" />
            Import from Last Session
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-[#767676] hover:text-gray-800 text-[11px] sm:text-[12px] font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Chat Header Component
function ChatHeader({ onSummariesClick, onMoodCheckinClick }: {
  onSummariesClick: () => void;
  onMoodCheckinClick: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-[#1F85CD] to-[#6EC3FC] text-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-10 rounded-full flex items-center justify-center">
           <Image 
                       src="/Logo.png" 
                       alt="Psychology Buddy Logo" 
                       width={46}
                       height={46}
                       className="w-[20px] h-[20px] sm:w-[30px] sm:h-[30px] md:w-[36px] md:h-[36px]"
                     />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg md:text-[24px] font-semibold">Psychology Buddy</h2>
            <p className="text-xs sm:text-xs md:text-[14px] text-[#F5F5F5] opacity-90 hidden sm:block">Your Emotional Support Companion</p>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2">
          {/* <button
            onClick={onMoodCheckinClick}
            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] sm:text-sm font-medium transition-colors"
          >
            Mood
          </button> */}
          <button
            onClick={onSummariesClick}
            className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 sm:w-[146px] sm:h-[45px] bg-[#76C5FB] hover:bg-[#93cff8] rounded-[8px] sm:rounded-[12px] text-white text-[12px] sm:text-[16px] font-medium transition-colors shadow-sm"
          >
            <Image src="/Icons/ion_book-outline.png" alt="Book icon" width={14} height={14} className="filter brightness-0 invert w-3 h-3 sm:w-4 sm:h-4"/>
            <span className="hidden sm:inline">Summaries</span>
            {/* <span className="sm:hidden"></span> */}
          </button>
        </div>
      </div>
    </div>
  );
}

// Disclaimer Component
function Disclaimer() {
  return (
    <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3  ">
      <div className="flex items-center justify-center gap-2">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-yellow-500 "
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 11.5V16h-4v-2.5c-1.68-.73-2.5-2.51-2.5-4.5 0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.99-.82 3.77-2.5 4.5z"/>
            <path d="M9 21h6v1c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1z"/>
          </svg>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 text-center">
          <span className="font-semibold">Remember:</span> Psychology Buddy provides supportive guidance, but if you're experiencing a crisis, please reach out to your school counselor or a trusted adult and this chat data appears to you only.
        </p>
      </div>
    </div>
  );
}

// Main Chat Interface Component
export default function ChatInterface({
  studentId,
  moodCheckinId,
  triggerId,
  mood,
  triggers,
  notes,
}: ChatInterfaceProps) {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Reusable authentication hook
  const { user, loading: authLoading, error: authError } = useServerAuth();
  
  // Reusable chat access hook - allows chat without mood if already checked in today
  const { canAccessChat, requiresMoodCheckin, params, loading: accessLoading, hasCheckedInToday } = useChatAccess();
  
  // Extract parameters for readability
  const { mood: accessMood, triggers: accessTriggers, notes: accessNotes, moodCheckinId: accessMoodCheckinId, triggerId: accessTriggerId } = params;

  // Combined loading state
  const loading = authLoading || accessLoading;
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryImport, setShowSummaryImport] = useState(true);
  
  // Check if user is importing from reflections page
  const [isImportingFromReflections, setIsImportingFromReflections] = useState(false);
  
  // Check URL parameters for import on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const importedText = urlParams.get('import');
      const hasImportParam = !!importedText && importedText.trim() !== '';
      
      console.log('ChatInterface - Import check:', {
        importedText,
        hasImportParam,
        fullUrl: window.location.href
      });
      
      setIsImportingFromReflections(hasImportParam);
      
      // Hide the old summary import if coming from reflections
      if (hasImportParam) {
        setShowSummaryImport(false);
      }
    }
  }, []);

  // Memoize error handler to prevent infinite re-renders
  const handleError = useCallback((err: Error) => {
    console.error("Chat error:", err);
    setError(err.message);
  }, []);

  // Only call chat hooks when user is available - this prevents the "Student ID is required" error
  const chatHookResult = useChat({
    studentId: user?.studentId || user?.id || "",
    mood: mood || accessMood,
    triggers: triggers || accessTriggers,
    notes: notes || accessNotes,
    onError: user ? handleError : undefined, // Only pass error handler when user exists
  });

  const {
    messages,
    input: hookInput,
    isLoading: hookIsLoading,
    sessionId: hookSessionId,
    chatRef: hookChatRef,
    sendMessage,
    setInput,
    initializeChat,
    endChat,
    importConversation,
  } = chatHookResult;

  // Only call summary hook when user is available
  const summaryHookResult = useChatSummary({ studentId: user?.studentId || user?.id || "" });
  const { lastSession, importLastSession, getLastSessionMessages } = summaryHookResult;

  // Event handlers
  const handleQuickReply = useCallback((reply: string) => {
    setInput(reply);
  }, [setInput]);

  const handleImportLastConversation = useCallback((topic?: string) => {
    console.log('Import clicked - lastSession:', lastSession)
    console.log('Import clicked - messages available:', lastSession?.messages?.length || 0)
    
    if (lastSession?.messages && lastSession.messages.length > 0) {
      // Import the full conversation history
      const previousMessages = getLastSessionMessages()
      console.log('Previous messages to import:', previousMessages)
      
      // Load previous conversation using the new importConversation method
      if (previousMessages.length > 0) {
        const sessionStartTime = new Date(lastSession.sessionStartedAt).getTime()
        importConversation(previousMessages, lastSession.sessionId, sessionStartTime)
        console.log('Imported conversation with session ID:', lastSession.sessionId, 'start time:', lastSession.sessionStartedAt)
        
        // Hide the import suggestion
        setShowSummaryImport(false)
        
        // Set a continuation message in the input
        const continuationText = topic 
          ? `I'd like to continue our conversation about ${topic} from our last session.`
          : `I'd like to continue our conversation from where we left off.`
        setInput(continuationText)
        console.log('Set continuation text:', continuationText)
      }
    } else {
      // Fallback to text-only import if no messages are available
      console.log('No messages found, falling back to text import')
      const importedText = topic 
        ? `I'd like to continue our conversation about ${topic} from our last session.`
        : importLastSession() || ''
      setInput(importedText)
    }
  }, [lastSession, getLastSessionMessages, importLastSession, setInput, importConversation])

  const handleDismissSummary = useCallback(() => {
    setShowSummaryImport(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (hookInput.trim() && user) { // Only send message if user exists
      // Hide summary import when student sends their first message
      setShowSummaryImport(false);
      sendMessage(hookInput);
      setInput("");
    }
  }, [hookInput, sendMessage, user, setInput]);

  const handleSummariesClick = useCallback(() => {
    router.push('/students/reflections');
  }, [router]);

  const handleMoodCheckinClick = useCallback(() => {
    router.push('/students/mood-checkin');
  }, [router]);

  // Update local state from hooks
  React.useEffect(() => {
    setIsLoading(hookIsLoading);
  }, [hookIsLoading]);

  // Debug logging and ensure chat initialization
  React.useEffect(() => {
    console.log('ChatInterface Debug:', {
      user: user?.id,
      mood: mood || accessMood,
      triggers: triggers || accessTriggers,
      notes: notes || accessNotes,
      messages: messages.length,
      hookSessionId,
      hookIsLoading
    });

    // If we have a user but no messages and no session ID, try to initialize
    if (user && messages.length === 0 && !hookSessionId && !hookIsLoading) {
      console.log('Manually triggering chat initialization');
      initializeChat(mood || accessMood, triggers || accessTriggers, notes || accessNotes);
    }
  }, [messages, mood, accessMood, triggers, accessTriggers, notes, accessNotes, hookIsLoading, hookSessionId, initializeChat]);

  // State to track if last message was from user
  const [lastMessageWasFromUser, setLastMessageWasFromUser] = useState(false);
  
  // State for exercise suggestions
  const [showExerciseSuggestions, setShowExerciseSuggestions] = useState(false);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<any[]>([]);
  const [studentMessageCount, setStudentMessageCount] = useState(0);

  // Auto-scroll to bottom - only when user sends message, not when bot responds
  React.useEffect(() => {
    if (chatRef.current && lastMessageWasFromUser) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
      setLastMessageWasFromUser(false);
    }
  }, [messages, lastMessageWasFromUser]);

  // Track when user sends messages and count them
  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'student') {
        setLastMessageWasFromUser(true);
        setStudentMessageCount(prev => {
          const newCount = prev + 1;
          // Show exercise suggestions after 5 student messages
          if (newCount === 5) {
            fetchExerciseSuggestions();
          }
          return newCount;
        });
      }
    }
  }, [messages]);

  // Fetch exercise suggestions
  const fetchExerciseSuggestions = async () => {
    try {
      const [musicRes, meditationRes, articlesRes] = await Promise.all([
        fetch('/api/student/music/recommended'),
        fetch('/api/student/meditation'),
        fetch('/api/articles')
      ]);

      // Handle different response formats
      let musicData = [];
      let meditationData = [];
      let articlesData = [];

      if (musicRes.ok) {
        const musicResult = await musicRes.json();
        musicData = Array.isArray(musicResult) ? musicResult : (musicResult.data || musicResult.music || []);
      }

      if (meditationRes.ok) {
        const meditationResult = await meditationRes.json();
        meditationData = Array.isArray(meditationResult) ? meditationResult : (meditationResult.data || meditationResult.meditations || []);
      }

      if (articlesRes.ok) {
        const articlesResult = await articlesRes.json();
        articlesData = Array.isArray(articlesResult) ? articlesResult : (articlesResult.data || articlesResult.articles || []);
      }

      const suggestions = [
        ...musicData.slice(0, 2).map((item: any) => ({
          type: 'music',
          title: item.title || 'Music Therapy',
          description: item.description || 'Calming music session',
          url: '/students/selfhelptools/music',
          icon: '🎵'
        })),
        ...meditationData.slice(0, 2).map((item: any) => ({
          type: 'meditation',
          title: item.title || 'Meditation',
          description: item.description || 'Guided meditation',
          url: '/students/selfhelptools/meditation',
          icon: '🧘'
        })),
        ...articlesData.slice(0, 2).map((item: any) => ({
          type: 'article',
          title: item.title || 'Helpful Article',
          description: item.description || 'Educational content',
          url: '/students/library',
          icon: '📚'
        })),
        {
          type: 'journaling',
          title: 'Journaling',
          description: 'Express your thoughts through writing',
          url: '/students/selfhelptools/journaling',
          icon: '📝'
        }
      ].slice(0, 5); // Limit to 4 suggestions

      setExerciseSuggestions(suggestions);
      setShowExerciseSuggestions(true);
    } catch (error) {
      console.error('Error fetching exercise suggestions:', error);
      // Fallback to default suggestions if API fails
      const fallbackSuggestions = [
        {
          type: 'music',
          title: 'Music Therapy',
          description: 'Calming music to help you relax',
          url: '/students/selfhelptools/music',
          icon: '🎵'
        },
        {
          type: 'meditation',
          title: 'Meditation',
          description: 'Guided meditation exercises',
          url: '/students/selfhelptools/meditation',
          icon: '🧘'
        },
        {
          type: 'journaling',
          title: 'Journaling',
          description: 'Write down your thoughts and feelings',
          url: '/students/selfhelptools/journaling',
          icon: '📝'
        },
        {
          type: 'article',
          title: 'Helpful Articles',
          description: 'Educational content about mental health',
          url: '/students/library',
          icon: '📚'
        }
      ];
      setExerciseSuggestions(fallbackSuggestions);
      setShowExerciseSuggestions(true);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    router.push(suggestion.url);
  };

  // Dismiss suggestions
  const dismissSuggestions = () => {
    setShowExerciseSuggestions(false);
  };

  // Auto-import summary text into input when coming from summaries page
  // REMOVED: We don't want to automatically set the input when importing from reflections
  // The user should manually send the message after seeing the context-aware opening message

  // Handle authentication error
  // if (authError || !user) {
  //   return (
  //     <div className="min-h-screen bg-[#F8F9FA]">
  //       <div className="max-w-7xl mx-auto pt-3 sm:pt-4 px-3 sm:px-4 lg:px-6">
  //         <BackToDashboard />
  //       </div>
  //       <div className="min-h-screen flex items-center justify-center">
  //         <AuthError onRetry={() => NavigationUtils.navigateToLogin(router)} />
  //       </div>
  //     </div>
  //   );
  // }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto pt-3 sm:pt-4 px-3 sm:px-4 lg:px-6">
          <BackToDashboard />
        </div>
        <FullPageLoading message="Loading chat..." />
      </div>
    );
  }

  // Redirect if mood checkin is required (handled by hook, but double-check)
  if (requiresMoodCheckin) {
    NavigationUtils.navigateToMoodCheckin(router);
    return null;
  }

  return (
    <div className="max-h-screen bg-[#F8F9FA]">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto pt-6 sm:pt-5 px-3 sm:px-4 lg:px-4">
        <BackToDashboard />
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-9 py-3 sm:py-4 lg:py-1">
        <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] lg:h-[calc(100vh-150px)] bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Chat Header */}
          <ChatHeader onSummariesClick={handleSummariesClick} onMoodCheckinClick={handleMoodCheckinClick} />

          {/* Last Summary Import - Hide when importing from reflections */}
        

          {/* Error Display */}
          {error && (
            <div className="mx-3 sm:mx-4 lg:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-xs sm:text-sm text-center">{error}</p>
          </div>
          )}

          {/* Chat Area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-15 py-3 sm:py-4 lg:py-6 bg-white">
           
              

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#1B9EE0] to-[#4FC3F7] flex items-center justify-center mb-3 sm:mb-4">
                  <svg width="28" height="28" className="sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1 sm:mb-2">Hi there! 👋</h3>
                <p className="text-sm sm:text-base text-gray-500 max-w-sm sm:max-w-md">
                  I&apos;m here to listen and support you. Feel free to share what&apos;s on your mind.
                </p>
              </div>
            )}

            {messages.map((message: Message) => (
              <ChatMessage 
                key={message.id} 
                message={{
                  id: message.id,
                  sender: message.sender,
                  content: message.content,
                  timestamp: message.timestamp,
                  type: message.type,
                  importSuggestion: message.importSuggestion,
                }} 
                onImportLastConversation={handleImportLastConversation}
                lastSession={lastSession || undefined}
                showSummaryImport={showSummaryImport}
                isImportingFromReflections={isImportingFromReflections}
                onDismissSummary={handleDismissSummary}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Exercise Suggestions */}
            {showExerciseSuggestions && (
              <ExerciseSuggestions
                suggestions={exerciseSuggestions}
                onSuggestionClick={handleSuggestionClick}
                onDismiss={dismissSuggestions}
              />
            )}

          </div>

          {/* Quick Replies */}
          <QuickReplies
            replies={DEFAULT_QUICK_REPLIES}
            onReplyClick={handleQuickReply}
          />

          {/* Chat Input */}
          <ChatInput
            input={hookInput}
            onInputChange={setInput}
            onSend={handleSendMessage}
            disabled={isLoading}
          />

          {/* Disclaimer */}
        </div>
      </div>
          <Disclaimer />
    </div>
  );
}
