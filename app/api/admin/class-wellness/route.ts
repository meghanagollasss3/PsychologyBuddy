import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/admin/class-wellness - Get class-wise wellness data
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      } else if (!schoolId || schoolId === 'all') {
        // Superadmin viewing all schools, or no school selected, so no class heatmap
        return Response.json({
          success: true,
          data: []
        });
      }
    }

    if (!targetSchoolId) {
      return Response.json({
        success: false,
        message: 'School ID not provided or unauthorized'
      }, { status: 400 });
    }

    // Get all classes for the target school with student counts and alert counts
    try {
      const classes = await prisma.class.findMany({
        where: {
          schoolId: targetSchoolId,
        },
        include: {
          _count: {
            select: {
              users: {
                where: {
                  role: { name: 'STUDENT' }
                }
              }
            }
          },
          users: {
            where: {
              role: { name: 'STUDENT' }
            },
            select: {
              id: true,
              highRiskAlerts: {
                where: { resolved: false },
                select: { id: true }
              },
              escalationAlerts: {
                where: { status: 'open' },
                select: { id: true }
              }
            }
          }
        },
        orderBy: [
          { grade: 'asc' },
          { section: 'asc' }
        ]
      });

      // Transform the data to match the expected format
      const classWellnessData = classes.map(cls => {
        // Count total alerts for all students in this class
        let totalAlerts = 0;
        cls.users.forEach(student => {
          const highRiskCount = student.highRiskAlerts?.length || 0;
          const escalationCount = student.escalationAlerts?.length || 0;
          totalAlerts += highRiskCount + escalationCount;
        });

        return {
          className: cls.name,
          studentCount: cls._count.users,
          alertCount: totalAlerts
        };
      });

      return Response.json({
        success: true,
        data: classWellnessData
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return Response.json({
        success: false,
        message: 'Database query failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Get class wellness data error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
