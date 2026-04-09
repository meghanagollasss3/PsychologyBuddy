import { NextRequest } from 'next/server';
import { SchoolLocationService } from '@/src/services/school-location.service';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools/locations/[locationId]/details - Get location details with users and classes
export const GET = async (req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) => {
  try {
    const { locationId } = await params;
    const result = await SchoolLocationService.getLocationDetails(locationId);
    return Response.json(result.data);
  } catch (error) {
    console.error('Get location details error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};
