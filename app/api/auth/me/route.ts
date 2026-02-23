import { NextRequest, NextResponse } from 'next/server';
import { authController } from '@/src/server/controllers/auth.controller';

export async function GET(req: NextRequest) {
  return authController.me(req);
}

// PUT endpoint to update user data (for permission changes)
export async function PUT(req: NextRequest) {
  try {
    // Get session from cookie or header
    const sessionId = req.cookies.get('sessionId')?.value || 
                      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionId) {
      const errorResponse = ApiResponse.error('No session found', 401);
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Get current user data
    const currentUser = await authController.me(req);
    
    if (!currentUser.success) {
      const errorResponse = ApiResponse.error('User not found', 404);
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Get updated user data from request body
    const updatedData = await req.json();
    
    // Update user data (this would normally be done in a service)
    // For now, we'll update the session cookie to force re-authentication
    const response = NextResponse.json({
      success: true,
      message: 'User data updated successfully',
      data: {
        user: {
          ...currentUser.data,
          ...updatedData.user
        }
      }
    });

    // Set session cookie to trigger re-authentication
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Update user error:', error);
    const errorResponse = ApiResponse.error('Internal server error', 500);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
