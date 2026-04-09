import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/admin/locations/assigned - Get admin's assigned locations
export const GET = withPermission({ 
  module: 'USER_MANAGEMENT', 
  action: 'VIEW' 
})(async (req: NextRequest, ctx: any) => {
  try {
    const user = ctx.user;
    
    console.log('Fetching assigned locations for user:', {
      userId: user.id,
      userRole: user.role.name,
      userEmail: user.email
    });
    
    // Only ADMIN users can access their assigned locations
    if (user.role.name !== 'ADMIN') {
      console.log('User is not ADMIN, role:', user.role.name);
      return NextResponse.json(
        { success: false, message: 'Only ADMIN users can access their assigned locations' },
        { status: 403 }
      );
    }

    // Get admin's assigned locations
    const assignedLocations = await prisma.locationAdminAssignment.findMany({
      where: { adminId: user.id },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          }
        }
      }
    });

    console.log('Found assigned locations:', assignedLocations.length);
    console.log('Location assignments:', assignedLocations);

    return NextResponse.json({
      success: true,
      data: assignedLocations.map(assignment => ({
        locationId: assignment.locationId,
        name: assignment.location.name,
        address: assignment.location.address,
        city: assignment.location.city
      }))
    });

  } catch (error) {
    console.error('Get assigned locations error:', error);
    const errorResponse = handleError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
