import { NextRequest } from 'next/server';
import { SchoolLocationService } from '@/src/services/school-location.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools/locations - Get all locations for a school
// Query params: schoolId (required)
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return Response.json(
        { error: { message: 'School ID is required', code: 400 } },
        { status: 400 }
      );
    }

    // If schoolId is provided, get locations for that school
    const result = await SchoolLocationService.getSchoolLocations(schoolId);
    return Response.json(result.data);
  } catch (error) {
    console.error('Get school locations error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};

// POST /api/admin/schools/locations - Create new school location
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'CREATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    console.log('Creating location with data:', body);

    const result = await SchoolLocationService.createLocation(body);
    console.log('Location created successfully:', result);
    return Response.json(result);
  } catch (error) {
    console.error('Create school location error:', error);
    const errorResponse = handleError(error);
    console.log('Error response:', errorResponse);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
