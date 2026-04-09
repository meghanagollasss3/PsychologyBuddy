import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// POST /api/schools/locations - Create new location for a school
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'CREATE' 
})(async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    const location = await prisma.schoolLocation.create({
      data: {
        schoolId: body.schoolId,
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        notes: body.notes,
        isMain: body.isMain || false,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            users: true,
            classes: true,
          }
        }
      }
    });

    return Response.json({
      success: true,
      data: location,
      message: 'Location created successfully'
    });
  } catch (error) {
    console.error('Create location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// GET /api/schools/locations - Get locations for a school
export const GET = withPermission({
  module: 'ORGANIZATIONS',
  action: 'VIEW'
})(async (req: NextRequest) => {
  try {
    console.log('GET locations API called');
    console.log('Prisma client check:', typeof prisma, prisma.schoolLocation ? 'has schoolLocation' : 'missing schoolLocation');
    
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');

    console.log('SchoolId:', schoolId);

    if (!schoolId) {
      return Response.json(
        { success: false, message: 'schoolId parameter is required' },
        { status: 400 }
      );
    }

    const locations = await prisma.schoolLocation.findMany({
      where: { schoolId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            users: {
              where: {
                role: {
                  name: 'STUDENT'
                }
              }
            },
            classes: true,
          }
        },
      },
      orderBy: [
        { isMain: 'desc' },
        { name: 'asc' }
      ]
    });

    console.log('Found locations:', locations.length);

    return Response.json({
      success: true,
      data: locations,
      message: 'Locations retrieved successfully'
    });
  } catch (error) {
    console.error('Get locations error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// PUT /api/schools/locations - Update location
export const PUT = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'UPDATE' 
})(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return Response.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }

    const location = await prisma.schoolLocation.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return Response.json({
      success: true,
      data: location,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// DELETE /api/schools/locations - Delete location
export const DELETE = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'DELETE' 
})(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('id');

    if (!locationId) {
      return Response.json(
        { success: false, message: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Check if location has users or classes
    const location = await prisma.schoolLocation.findUnique({
      where: { id: locationId },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
          }
        }
      }
    });

    if (!location) {
      return Response.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    if (location._count.users > 0 || location._count.classes > 0) {
      return Response.json(
        { success: false, message: 'Cannot delete location with existing users or classes' },
        { status: 400 }
      );
    }

    await prisma.schoolLocation.delete({
      where: { id: locationId }
    });

    return Response.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
