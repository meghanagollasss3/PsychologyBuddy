import { NextRequest, NextResponse } from 'next/server';
import { LibraryController } from '@/src/server/content/library/library.controller';
import { getSession } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';

// GET /api/student/library/metadata - Get categories for students
export async function GET(req: NextRequest) {
  try {
    // Basic session validation - just check if user is logged in
    const session = await getSession(req);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Use the same metadata endpoint as admin (categories are public)
    // Pass empty context since we don't need it for metadata
    const result = await LibraryController.getLibraryMetadata(req, {});
    
    return result;
  } catch (error) {
    console.error('Get student library metadata error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
