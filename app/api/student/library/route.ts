import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/src/server/content/library/library.service';
import { getSession } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';

// GET /api/student/library - Get all published articles for students with pagination
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
    
    // Get pagination parameters from URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    
    // For now, get all articles without school filtering to test
    const result = await LibraryService.getAllArticles(undefined, undefined, page, limit);
    
    // Filter only published articles for students
    const publishedArticles = result.data.filter((article: any) => article.status === 'PUBLISHED');
    
    return NextResponse.json({
      success: true,
      message: 'Published articles retrieved successfully',
      data: publishedArticles,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get student articles error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
