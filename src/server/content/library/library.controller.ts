import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from './library.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import { CreateArticleSchema, UpdateArticleSchema } from './library.validators';

export class LibraryController {
  // GET /api/admin/content/library - Get articles (Admin & SuperAdmin)
  static getArticles = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'VIEW' 
  })(async (req: NextRequest, { user }: any) => {
    try {
      // For regular admins, use their schoolId
      // For super admins, no school filtering (can see all articles)
      const userSchoolId = user.role?.name === 'SUPERADMIN' ? undefined : user.schoolId;
      const result = await LibraryService.getAllArticles(userSchoolId);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get articles error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // POST /api/admin/content/library - Create article (Admin & SuperAdmin)
  static createArticle = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'CREATE' 
  })(async (req: NextRequest, { user }: any) => {
    try {
      const body = await req.json();
      const validatedData = CreateArticleSchema.parse(body);
      
      const result = await LibraryService.createArticle(validatedData, user.id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Create article error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // GET /api/admin/content/library/[id] - Get article by ID (Admin & SuperAdmin)
  static getArticleById = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'VIEW' 
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { id } = await params;
      const result = await LibraryService.getArticleById(id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get article error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // PUT /api/admin/content/library/[id] - Update article (Admin & SuperAdmin)
  static updateArticle = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'UPDATE' 
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = UpdateArticleSchema.parse(body);
      
      const result = await LibraryService.updateArticle(id, validatedData);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Update article error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // DELETE /api/admin/content/library/[id] - Delete article (Admin & SuperAdmin)
  static deleteArticle = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'DELETE' 
  })(async (req: NextRequest, { params }: any) => {
    try {
      const { id } = await params;
      const result = await LibraryService.deleteArticle(id);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Delete article error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });

  // GET /api/admin/content/library/metadata - Get categories, moods, and goals (Admin & SuperAdmin)
  static getLibraryMetadata = withPermission({ 
    module: 'PSYCHO_EDUCATION', 
    action: 'VIEW' 
  })(async (req: NextRequest) => {
    try {
      const result = await LibraryService.getLibraryMetadata();
      return NextResponse.json(result);
    } catch (error) {
      console.error('Get library metadata error:', error);
      const errorResponse = handleError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
    }
  });
}
