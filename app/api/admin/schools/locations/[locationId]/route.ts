import { NextRequest } from 'next/server';
import { SchoolLocationService } from '@/src/services/school-location.service';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/schools/locations/[locationId] - Get location by ID
export const GET = async (req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) => {
  try {
    const { locationId } = await params;
    const result = await SchoolLocationService.getLocationById(locationId);
    return Response.json(result.data);
  } catch (error) {
    console.error('Get location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};

// PUT /api/admin/schools/locations/[locationId] - Update location
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) => {
  try {
    const { locationId } = await params;
    const body = await req.json();

    const result = await SchoolLocationService.updateLocation(locationId, body);
    return Response.json(result.data);
  } catch (error) {
    console.error('Update location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};

// DELETE /api/admin/schools/locations/[locationId] - Delete location
export const DELETE = async (req: NextRequest, { params }: { params: Promise<{ locationId: string }> }) => {
  try {
    const { locationId } = await params;
    const result = await SchoolLocationService.deleteLocation(locationId);
    return Response.json(result.data);
  } catch (error) {
    console.error('Delete location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
};
