import { NextResponse } from "next/server";
import prisma from "@/src/prisma";
import Groq from "groq-sdk";
import { PSYCHOLOGY_BUDDY_SYSTEM_PROMPT } from "@/src/lib/ai/prompts/system-prompt";
import { ContentEscalationDetector } from "@/src/services/escalations/content-escalation-detector";
import { EscalationAlertService } from "@/src/services/escalations/escalation-alert-service";

// Initialize Groq with error handling
let groq: Groq;
try {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
  });
  console.log('Groq client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Groq client:', error);
  groq = null as any;
}

export async function POST(req: Request) {
  try {
    const { message, studentId, sessionId } = await req.json();

    console.log('[ChatStream] Request received:', { studentId, sessionId, messageLength: message?.length });

    if (!message || !studentId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('Chat stream request:', { message, studentId, sessionId });

    // Verify that the chat session exists and belongs to the student
    // First get the user ID from studentId
    const user = await prisma.user.findUnique({
      where: { studentId: studentId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        isActive: true
      }
    });

    console.log('Session lookup result:', session);

    if (!session) {
      // Try to find any session for this student to help debug
      const allStudentSessions = await prisma.chatSession.findMany({
        where: { userId: user.id },
        select: { id: true, isActive: true, startedAt: true }
      });
      console.log('All student sessions:', allStudentSessions);
      
      return NextResponse.json(
        { error: "Chat session not found or inactive" },
        { status: 404 }
      );
    }

    // Save student message
    console.log('Saving student message for session:', sessionId);
    const studentMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderType: "STUDENT",
        content: message,
      },
    });
    console.log('Student message saved:', studentMessage.id);

    // Check for escalation indicators in the student's message
    console.log('[EscalationCheck] Analyzing message for escalation indicators');
    try {
      // Get conversation context for better analysis
      const recentMessages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { content: true, senderType: true }
      });

      const conversationContext = recentMessages
        .reverse()
        .slice(0, -1) // Exclude the current message
        .map(msg => msg.senderType === 'STUDENT' ? msg.content : `Bot: ${msg.content}`);

      // Analyze the message for escalation indicators
      const detection = await ContentEscalationDetector.analyzeMessage(
        message,
        studentId,
        sessionId,
        conversationContext
      );

      console.log('[EscalationCheck] Detection result:', {
        isEscalation: detection.isEscalation,
        category: detection.category.type,
        level: detection.level.level,
        severity: detection.level.severity,
        confidence: detection.category.confidence
      });

      // If this is a valid escalation, create an alert
      if (ContentEscalationDetector.isValidEscalation(detection)) {
        console.log('[EscalationCheck] Valid escalation detected, checking for existing alerts');
        
        try {
          // Check if an alert already exists for this student with the same message content
          // Use a more robust deduplication strategy across all sessions
          const existingAlert = await prisma.escalationAlert.findFirst({
            where: {
              studentId: user.id, // Use the resolved user ID instead of studentId
              messageContent: message,
              createdAt: {
                gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
              }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (existingAlert) {
            console.log('[EscalationCheck] Alert already exists for this student with similar message, skipping creation:', existingAlert.id);
            console.log('[EscalationCheck] Existing alert details:', {
              sessionId: existingAlert.sessionId,
              messageContent: existingAlert.messageContent,
              createdAt: existingAlert.createdAt
            });
          } else {
            const alert = await EscalationAlertService.createEscalationAlert(
              studentId,
              sessionId,
              detection,
              message,
              studentMessage.createdAt.toISOString()
            );

            console.log('[EscalationCheck] Alert created successfully:', alert.id);
          }
          
          // If immediate action is required, we might want to modify the AI response
          if (detection.level.requiresImmediateAction) {
            console.log('[EscalationCheck] Immediate action required - will provide supportive response');
          }
        } catch (error) {
          console.error('[EscalationCheck] Failed to create escalation alert:', error);
          // Don't fail the chat request if alert creation fails
        }
      }
    } catch (error) {
      console.error('[EscalationCheck] Error in escalation detection:', error);
      // Don't fail the chat request if escalation detection fails
    }

    // Try to get AI response with retry logic
    let botReply = "";
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const stream = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: PSYCHOLOGY_BUDDY_SYSTEM_PROMPT
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: true,
        });

        const responseStream = new ReadableStream({
          async start(controller) {
            try {
              let rawResponse = "";
              
              // Collect the full response first
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                  rawResponse += content;
                }
              }

              console.log('AI response:', rawResponse);
              
              // Send the response directly (no structured formatting needed)
              controller.enqueue(new TextEncoder().encode(rawResponse));
              
              // Save bot reply message
              console.log('Saving bot message for session:', sessionId);
              const botMessage = await prisma.chatMessage.create({
                data: {
                  sessionId,
                  senderType: "BOT",
                  content: rawResponse,
                },
              });
              console.log('Bot message saved:', botMessage.id);
              
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        return new Response(responseStream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      } catch (error: any) {
        if (error.message.includes('429') && retryCount < maxRetries - 1) {
          retryCount++;
          const delayMs = Math.pow(2, retryCount) * 1000;
          console.log(`Stream rate limited, retrying in ${delayMs}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        console.log(`Stream AI request failed: ${error.message}`);
        break;
      }
    }
    
    // If all retries fail, send a fallback response
    const fallbackMessage = "I understand you're sharing something important. I'm Psychology Buddy, and sometimes the AI service might be busy, but I'm here to listen. Could you tell me more about what's on your mind?";
    console.log("Using fallback response");
    
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackMessage));
        controller.close();
      },
    });

    return new Response(fallbackStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Chat stream error:", err);
    
    if (err instanceof Error && err.message.includes('429')) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again in a few moments." },
        { status: 429 }
      );
    }
    
    if (err instanceof Error && err.message.includes('API key')) {
      return NextResponse.json(
        { error: "Groq service configuration error. Please contact support." },
        { status: 500 }
      );
    }
    
    if (err instanceof Error && err.message.includes('insufficient_quota')) {
      return NextResponse.json(
        { error: "Groq quota exceeded. Please check your billing details." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}