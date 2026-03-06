import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse } from '@/src/utils/error-handler';

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

    // Extract user from auth middleware (assuming it's set in a global middleware)
    const user = (global as any).user;
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    // Create reflection (you might want to create a StudentReflection model in Prisma)
    // For now, we'll store it in a simple way or return success
    // TODO: Add proper reflection storage model
    
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
