import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools/[schoolId]/sections - Get all sections for a specific school
export const GET = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'VIEW' 
})(async (req: NextRequest, { params, user }: any) => {
  try {
    const { schoolId } = await params;
    console.log('Fetching sections for school:', schoolId);
    
    // For now, return empty array - this would typically fetch from database
    // You can modify this to fetch actual school sections from your database
    const sections = await UserService.getSchoolSections(schoolId);
    
    return Response.json({
      success: true,
      sections: sections.data || []
    });
  } catch (error) {
    console.error('Get school sections error:', error);
    const errorResponse = handleError(error);
    return Response.json({
      success: false,
      error: errorResponse.error?.message || 'Failed to fetch school sections'
    }, { status: errorResponse.error?.code || 500 });
  }
});

// POST /api/admin/schools/[schoolId]/sections - Create a new section for a school
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'CREATE' 
})(async (req: NextRequest, { params, user }: any) => {
  try {
    const { schoolId } = await params;
    const body = await req.json();
    const { name } = body;
    
    console.log('Creating section for school:', schoolId, 'with name:', name);
    
    if (!name || !name.trim()) {
      return Response.json({
        success: false,
        error: 'Section name is required'
      }, { status: 400 });
    }
    
    // Create the section - this would typically save to database
    const section = await UserService.createSchoolSection(schoolId, name.trim());
    
    return Response.json({
      success: true,
      section: section.data
    });
  } catch (error) {
    console.error('Create school section error:', error);
    const errorResponse = handleError(error);
    return Response.json({
      success: false,
      error: errorResponse.error?.message || 'Failed to create school section'
    }, { status: errorResponse.error?.code || 500 });
  }
});
