import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// POST /api/locations/admins - Assign admin to location
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'UPDATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    const result = await UserService.assignAdminToLocation({
      ...body,
      assignedBy: user.id,
    });
    return Response.json(result);
  } catch (error) {
    console.error('Assign admin to location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// GET /api/locations/admins - Get location admin assignments (with filters)
export const GET = withPermission({
  module: 'ORGANIZATIONS',
  action: 'VIEW'
})(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');
    const adminId = searchParams.get('adminId');

    if (locationId) {
      // Get admins assigned to a specific location
      const result = await UserService.getLocationAdmins(locationId);
      return Response.json(result);
    } else if (adminId) {
      // Get locations assigned to a specific admin
      const result = await UserService.getAdminLocations(adminId);
      return Response.json(result);
    } else {
      return Response.json(
        { success: false, message: 'Either locationId or adminId parameter is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Get location admins error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// DELETE /api/locations/admins - Remove admin from location
export const DELETE = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'UPDATE' 
})(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId');
    const adminId = searchParams.get('adminId');

    if (!locationId || !adminId) {
      return Response.json(
        { success: false, message: 'Both locationId and adminId parameters are required' },
        { status: 400 }
      );
    }

    const result = await UserService.removeAdminFromLocation(locationId, adminId);
    return Response.json(result);
  } catch (error) {
    console.error('Remove admin from location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
