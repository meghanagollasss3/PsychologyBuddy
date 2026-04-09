import { NextRequest } from 'next/server';
import { SchoolLocationService } from '@/src/services/school-location.service';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools/with-locations - Get all schools with their locations
export const GET = async (req: NextRequest) => {
  try {
    const result = await SchoolLocationService.getSchoolsWithLocations();
    return Response.json(result.data);
  } catch (error) {
    console.error('Get schools with locations error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};
