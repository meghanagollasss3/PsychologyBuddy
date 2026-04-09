import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse } from '@/src/utils/error-handler';

// In-memory storage for reflections (temporary solution)
const reflectionStore: Record<string, { reflection: string; userId: string; createdAt: Date }> = {};

// GET - Retrieve existing student reflection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { message: 'Session ID is required' } },
        { status: 400 }
      );
    }

    // Get session from cookie for authentication
    const sessionIdCookie = request.cookies.get('sessionId')?.value || 
                          request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionIdCookie) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find session and user
    const { AuthRepository } = await import("@/src/server/repository/auth.repository");
    const session = await AuthRepository.findSessionBySessionId(sessionIdCookie);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await AuthRepository.deleteSession(sessionIdCookie);
      return NextResponse.json(
        { success: false, message: "Session expired" },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get reflection from in-memory store
    const storedReflection = reflectionStore[sessionId];
    
    return NextResponse.json({
      success: true,
      data: {
        reflection: storedReflection?.reflection || null
      }
    });

  } catch (error) {
    console.error('Get student reflection error:', error);
    const errorResponse = formatErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST - Create a new student reflection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reflection } = body;

    if (!sessionId || !reflection?.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'Session ID and reflection are required' } },
        { status: 400 }
      );
    }

    // Get session from cookie for authentication
    const sessionIdCookie = request.cookies.get('sessionId')?.value || 
                          request.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionIdCookie) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find session and user
    const { AuthRepository } = await import("@/src/server/repository/auth.repository");
    const session = await AuthRepository.findSessionBySessionId(sessionIdCookie);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await AuthRepository.deleteSession(sessionIdCookie);
      return NextResponse.json(
        { success: false, message: "Session expired" },
        { status: 401 }
      );
    }

    const user = session.user;

    // Store reflection in in-memory store (temporary solution)
    reflectionStore[sessionId] = {
      reflection: reflection.trim(),
      userId: user.id,
      createdAt: new Date()
    };
    
    console.log('Student reflection saved:', {
      userId: user.id,
      sessionId,
      reflection: reflection.trim(),
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Reflection saved successfully'
    });

  } catch (error) {
    console.error('Save student reflection error:', error);
    const errorResponse = formatErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
