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
    
    // Get user details to determine role and permissions
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: { cookie: req.headers.get('cookie') || '' }
    });
    const userData = await userResponse.json();
    const user = userData.data?.user;
    
    let schoolId = undefined;
    
    if (user?.role?.name === 'SUPERADMIN') {
      // For super admins, check if a specific school is selected
      const { searchParams } = new URL(req.url);
      const schoolFilter = searchParams.get('schoolId');
      
      if (schoolFilter && schoolFilter !== 'all') {
        schoolId = schoolFilter;
      }
      // If no school filter or 'all', schoolId remains undefined (show all articles)
    } else {
      // For regular admins, use their assigned school
      schoolId = user?.schoolId;
    }
    
    const result = await LibraryService.getAllArticles(schoolId);
    
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
