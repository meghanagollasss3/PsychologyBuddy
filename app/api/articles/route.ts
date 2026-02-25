import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/src/server/content/library/library.service';
import { getSession } from '@/src/utils/session-helper';
import { handleError } from '@/src/utils/errors';
import { CreateArticleSchema } from '@/src/server/content/library/library.validators';

// GET /api/articles - Get all articles (Admin & SuperAdmin)
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
    
    // Get user details to determine schoolId
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    const userData = await userResponse.json();
    
    // For regular admins, use their schoolId
    // For super admins, no school filtering (can see all articles)
    const userSchoolId = userData.data?.user?.role?.name === 'SUPERADMIN' ? undefined : userData.data?.user?.schoolId;
    
    const result = await LibraryService.getAllArticles(userSchoolId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get articles error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}

// POST /api/articles - Create article (Admin & SuperAdmin)
export async function POST(req: NextRequest) {
  try {
    // Basic session validation - just check if user is logged in
    const session = await getSession(req);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validatedData = CreateArticleSchema.parse(body);
    
    // Get user details to determine schoolId
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    const userData = await userResponse.json();
    
    // For regular admins, use their schoolId
    // For super admins, allow null (can create for all schools)
    const userSchoolId = userData.data?.user?.role?.name === 'SUPERADMIN' ? null : userData.data?.user?.schoolId;
    
    const result = await LibraryService.createArticle(validatedData, session.userId, userSchoolId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create article error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
}
