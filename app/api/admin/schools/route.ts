import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools - Get all schools for admin tools (Superadmin only)
export const GET = async (req: NextRequest) => {
  try {
    const schools = await UserService.getSchoolsWithMetrics();
    // Return just the schools array, not the full ApiResponse wrapper
    return Response.json(schools.data);
  } catch (error) {
    console.error('Get schools error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};

// POST /api/admin/schools - Create school (Superadmin only)
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'CREATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    console.log('Creating school with data:', body);
    console.log('User creating school:', user);
    
    const school = await UserService.createSchool(body);
    console.log('School created successfully:', school);
    return Response.json(school);
  } catch (error) {
    console.error('Create school error:', error);
    const errorResponse = handleError(error);
    console.log('Error response:', errorResponse);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
