import { NextResponse } from "next/server";
import prisma from "@/src/prisma";
import OpenAI from "openai";
import { OPENING_MESSAGE_PROMPTS } from "@/src/lib/ai/prompts/system-prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { studentId, mood, triggers, notes, skipImportSuggestion = false, importData } = await req.json();

    console.log('Chat start request:', { studentId, mood, triggers, notes, skipImportSuggestion, importData });

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required" },
        { status: 400 }
      );
    }

    // Check if student exists first, create if not (for development)
    let student = await prisma.user.findUnique({
      where: { studentId: studentId }
    });

    if (!student) {
      // Get the STUDENT role
      const studentRole = await prisma.role.findUnique({
        where: { name: "STUDENT" }
      });

      if (!studentRole) {
        return NextResponse.json(
          { success: false, message: "Student role not found" },
          { status: 500 }
        );
      }

      // Create a development student if none exists
      student = await prisma.user.create({
        data: {
          studentId: studentId,
          firstName: "Test",
          lastName: "Student",
          email: `${studentId}@test.com`,
          password: "dev_password", // In production, this should be hashed
          roleId: studentRole.id,
        }
      });
      console.log(`Created development student: ${studentId}`);
    }

    // Check for previous conversations
    const previousSummaries = await prisma.summary.findMany({
      where: { userId: student.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    const hasPreviousConversations = previousSummaries.length > 0;
    const lastSummary = hasPreviousConversations ? previousSummaries[0] : null;

    // Create Chat Session
    const session = await prisma.chatSession.create({
      data: {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: student.id,
        mood: mood || null,
        triggers: triggers?.length ? triggers.join(", ") : null,
      },
    });

    console.log('Created chat session:', { 
      sessionId: session.id, 
      studentId, 
      mood, 
      triggers,
      isActive: session.isActive 
    });

    // Generate Opening Message using OpenAI with retry logic
    let prompt = "";
    
    if (hasPreviousConversations && lastSummary && !skipImportSuggestion) {
      prompt = OPENING_MESSAGE_PROMPTS.returningWithImport(lastSummary.mainTopic, mood, triggers);
    } else if (hasPreviousConversations && lastSummary && skipImportSuggestion) {
      prompt = OPENING_MESSAGE_PROMPTS.continuingImport(lastSummary.mainTopic, mood, triggers);
    } else {
      prompt = OPENING_MESSAGE_PROMPTS.newChat(mood, triggers);
    }
    
    let openingMessage = "";
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        openingMessage = response.choices[0]?.message?.content || "";
        
        console.log('Opening message generated:', openingMessage);
        
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.error(`Opening message generation attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          // Fallback opening message
          openingMessage = "Hi! I'm Psychology Buddy. I'm here to listen and support you. How are you feeling today?";
          console.log('Using fallback opening message');
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    if (!openingMessage) {
      // Use a fallback message when OpenAI is unavailable
      openingMessage = "Hi there! I'm Psychology Buddy, your supportive AI companion. Sometimes the AI service might be busy, but I'm here to help you work through whatever's on your mind. How are you feeling right now?";
      console.log("Using fallback message due to OpenAI service unavailability");
    }

    // Save bot opening message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: "BOT",
        content: openingMessage,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      openingMessage,
    });
  } catch (err) {
    console.error("Opening message error:", err);
    
    // Log the actual error for debugging
    if (err instanceof Error) {
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    return NextResponse.json(
      { success: false, message: "Failed to start chat. Please try again." },
      { status: 500 }
    );
  }
}
