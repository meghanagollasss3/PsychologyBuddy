import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// PATCH /api/schools/[id] - Update school (Superadmin only)
export const PATCH = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const schoolId = req.nextUrl.pathname.split('/').pop();
    if (!schoolId) {
      return Response.json(
        { success: false, message: 'School ID is required' },
        { status: 400 }
      );
    }
    const body = await req.json();
    console.log('Update school request body:', body);
    
    // Filter out fields that don't exist in School model
    const { name, phone, email } = body;
    const updateData = { name, phone, email };
    console.log('Filtered update data:', updateData);
    
    const school = await UserService.updateSchool(schoolId, updateData);
    return Response.json(school);
  } catch (error) {
    console.error('Update school error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// GET /api/schools/[id] - Get school by ID (Superadmin only)
export const GET = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'VIEW' 
})(async (req: NextRequest) => {
  try {
    const schoolId = req.nextUrl.pathname.split('/').pop();
    if (!schoolId) {
      return Response.json(
        { success: false, message: 'School ID is required' },
        { status: 400 }
      );
    }
    const school = await UserService.getSchoolById(schoolId);
    return Response.json(school);
  } catch (error) {
    console.error('Get school error:', error);
    return Response.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/schools/[id] - Delete school (Superadmin only)
export const DELETE = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'DELETE' 
})(async (req: NextRequest, { params }: any) => {
  try {
    const schoolId = req.nextUrl.pathname.split('/').pop();
    if (!schoolId) {
      return Response.json(
        { success: false, message: 'School ID is required' },
        { status: 400 }
      );
    }
    
    const result = await UserService.deleteSchool(schoolId);
    return Response.json(result);
  } catch (error) {
    console.error('Delete school error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
