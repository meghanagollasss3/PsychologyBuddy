import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// POST /api/classes - Create class (Admin only)
export const POST = withPermission({ 
  module: 'USER_MANAGEMENT', 
  action: 'UPDATE' // Classes management falls under user management
})(async (req: NextRequest, { user, userSchoolId }: any) => {
  try {
    const body = await req.json();
    
    // Debug logging
    console.log('User:', user);
    console.log('UserSchoolId:', userSchoolId);
    
    // Validate required fields
    if (!body.name || !body.grade) {
      return Response.json(
        { success: false, message: 'Name and grade are required' },
        { status: 400 }
      );
    }

    // For SUPERADMIN, use the schoolId from the request body (selected by user)
    // For regular admins, use their assigned schoolId
    let schoolId;
    if (user.role.name === 'SUPERADMIN') {
      // SUPERADMIN can create classes for any school - use the selected schoolId from form
      schoolId = body.schoolId;
    } else {
      // Regular admin can only create classes for their assigned school
      schoolId = userSchoolId;
    }

    if (!schoolId) {
      return Response.json(
        { success: false, message: 'School ID is required' },
        { status: 400 }
      );
    }

    // Check if class already exists in the selected school
    console.log('Checking for existing class in school:', schoolId, 'with grade:', body.grade, 'section:', body.section);
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId: schoolId,
        grade: body.grade,
        section: body.section || null,
      },
      include: {
        school: { select: { name: true } },
        _count: {
          select: { users: true },
        },
      },
    });

    if (existingClass) {
      console.log('Found existing class:', existingClass);
      return Response.json({
        success: true,
        message: 'Class already exists',
        data: existingClass,
      });
    }

    // Class doesn't exist, create new one
    console.log('Class not found, creating new class');
    const newClass = await UserService.createClass({
      ...body,
      schoolId, // Use the determined schoolId
    });
    console.log('New class created:', newClass);
    return Response.json(newClass);
  } catch (error) {
    console.error('Create class error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error.code });
  }
});

// GET /api/classes - Get classes (Admin only - their school only)
export const GET = withPermission({ 
  module: 'USER_MANAGEMENT', 
  action: 'VIEW' 
})(async (req: NextRequest, { user, userSchoolId }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const querySchoolId = searchParams.get('schoolId');
    const filters = {
      grade: searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined,
      section: searchParams.get('section') || undefined,
      search: searchParams.get('search') || undefined,
    };
    
    // For SUPERADMIN, use query schoolId if provided, otherwise use userSchoolId or get all
    // For regular admins, use their assigned schoolId
    let schoolId;
    if (user.role.name === 'SUPERADMIN') {
      schoolId = querySchoolId || userSchoolId || undefined; // Use query param first, then user school, then undefined for all
    } else {
      schoolId = userSchoolId; // Must exist for non-SUPERADMIN
    }
    
    const classes = await UserService.getClasses(schoolId, filters);
    return Response.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error.code });
  }
});
