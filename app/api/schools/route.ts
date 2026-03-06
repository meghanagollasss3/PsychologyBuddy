import { NextRequest } from 'next/server';
import { UserService } from '@/src/services/user.service';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// POST /api/schools - Create school (Superadmin only)
export const POST = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'CREATE' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const body = await req.json();
    const school = await UserService.createSchool(body);
    return Response.json(school);
  } catch (error) {
    console.error('Create school error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// GET /api/schools - Get schools with search, pagination, and metrics (Superadmin only)
export const GET = withPermission({
  module: 'ORGANIZATIONS',
  action: 'VIEW'
})(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const schoolId = searchParams.get('schoolId');

    const offset = (page - 1) * limit;

    // Get today's date range for check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build where clause for schools
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalSchools = await prisma.school.count({ where: whereClause });

    // Get schools with pagination and counts
    const schools = await prisma.school.findMany({
      where: whereClause,
      include: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get alerts and check-ins for each school
    const schoolsWithMetrics = await Promise.all(
      schools.map(async (school) => {
        const [alertCount, checkInsToday] = await Promise.all([
          // Count unresolved escalation alerts for students in this school
          prisma.escalationAlert.count({
            where: {
              user: {
                schoolId: school.id,
                role: {
                  name: 'STUDENT'
                }
              },
              status: 'open'
            }
          }),
          // Count check-ins today for students in this school
          prisma.moodCheckin.count({
            where: {
              user: {
                schoolId: school.id,
                role: {
                  name: 'STUDENT'
                }
              },
              createdAt: {
                gte: today,
                lt: tomorrow
              }
            }
          })
        ]);

        console.log(`School ${school.name} - Alert count: ${alertCount}, Check-ins today: ${checkInsToday}`);

        return {
          id: school.id,
          name: school.name,
          location: school.address || 'Unknown Location',
          studentCount: school._count.users,
          alertCount,
          checkInsToday,
          address: school.address,
          phone: school.phone,
          email: school.email,
        };
      })
    );

    // Get global metrics
    const [totalStudents, activeAlerts, checkinsToday, totalCheckins] = await Promise.all([
      prisma.user.count({
        where: {
          role: {
            name: 'STUDENT'
          }
        }
      }),
      prisma.escalationAlert.count({
        where: {
          status: 'open'
        }
      }),
      prisma.moodCheckin.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      // Check for any check-ins in the system (for debugging)
      prisma.moodCheckin.count()
    ]);

    console.log(`Global metrics - Total students: ${totalStudents}, Active alerts: ${activeAlerts}, Check-ins today: ${checkinsToday}, Total check-ins ever: ${totalCheckins}`);
    console.log(`Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const totalPages = Math.ceil(totalSchools / limit);

    const response = {
      success: true,
      data: schoolsWithMetrics,
      pagination: {
        total: totalSchools,
        totalPages,
        page,
        limit,
      },
      metrics: {
        totalSchools,
        totalStudents,
        activeAlerts,
        checkinsToday,
      }
    };

    return Response.json(response);
  } catch (error) {
    console.error('Get schools error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});

// DELETE /api/schools/[id] - Delete school (Superadmin only)
export const DELETE = withPermission({ 
  module: 'ORGANIZATIONS', 
  action: 'DELETE' 
})(async (req: NextRequest, { params }: any) => {
  try {
    const { id } = params;
    const result = await UserService.deleteSchool(id);
    return Response.json(result);
  } catch (error) {
    console.error('Delete school error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
