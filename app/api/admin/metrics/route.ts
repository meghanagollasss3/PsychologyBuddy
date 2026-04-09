import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/dashboard/metrics - Get dashboard metrics
export const GET = withPermission({ 
  module: 'ANALYTICS', 
  action: 'VIEW' 
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const timeFilter = searchParams.get('timeFilter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on time filter
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        createdAt: {
          gte: new Date(startDate),
          lt: new Date(endDate),
        }
      };
    } else if (timeFilter) {
      const now = new Date();
      const start = new Date();
      const end = new Date();

      switch (timeFilter) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          // Start of current week (Sunday)
          const dayOfWeek = now.getDay();
          start.setDate(now.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          // End of current week (Saturday)
          end.setDate(now.getDate() + (6 - dayOfWeek));
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          // Start of current month
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          // End of current month
          end.setMonth(now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          // Default to today if no valid filter
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
      }

      dateRange = {
        createdAt: {
          gte: start,
          lt: end,
        }
      };
    }
    const totalStudents = await prisma.user.count({
      where: {
        role: { name: 'STUDENT' },
        ...(user.role.name === 'ADMIN' && user.schoolId ? {
          schoolId: user.schoolId
        } : {}),
        ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
          schoolId: user.schoolId
        } : {}),
        ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
          schoolId: schoolId
        } : {})
      }
    });

    // Get today's check-ins (or check-ins in selected time range)
    const checkinsToday = await prisma.moodCheckin.count({
      where: {
        ...dateRange,
        ...(user.role.name === 'ADMIN' && user.schoolId ? {
          user: {
            schoolId: user.schoolId
          }
        } : {}),
        ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
          user: {
            schoolId: user.schoolId
          }
        } : {}),
        ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
          user: {
            schoolId: schoolId
          }
        } : {})
      }
    });

    // Get active counselling sessions (chat sessions that are active)
    const activeSessions = await prisma.chatSession.count({
      where: {
        isActive: true,
        ...(user.role.name === 'ADMIN' && user.schoolId ? {
          user: {
            schoolId: user.schoolId
          }
        } : {}),
        ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
          user: {
            schoolId: user.schoolId
          }
        } : {}),
        ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
          user: {
            schoolId: schoolId
          }
        } : {})
      }
    });

    // Get high-risk alerts (unresolved) - count only active high and critical priority alerts within time range
    const [highRiskAlerts, escalationAlerts] = await Promise.all([
      prisma.highRiskAlert.count({
        where: {
          resolved: false, // Only active, unresolved alerts
          ...dateRange,
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
            user: {
              schoolId: user.schoolId
            }
          } : {}),
          ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
            user: {
              schoolId: user.schoolId
            }
          } : {}),
          ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
            user: {
              schoolId: schoolId
            }
          } : {})
        }
      }),
      prisma.escalationAlert.count({
        where: {
          status: 'open', // Only open alerts
          priority: {
            in: ['critical', 'high'] // Only critical and high priority
          },
          ...dateRange,
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
            studentId: {
              in: (
                await prisma.user.findMany({
                  where: { schoolId: user.schoolId, role: { name: 'STUDENT' } },
                  select: { id: true }
                })
              ).map(u => u.id)
            }
          } : {}),
          ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
            studentId: {
              in: (
                await prisma.user.findMany({
                  where: { schoolId: user.schoolId, role: { name: 'STUDENT' } },
                  select: { id: true }
                })
              ).map(u => u.id)
            }
          } : {}),
          ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
            studentId: {
              in: (
                await prisma.user.findMany({
                  where: { schoolId: schoolId, role: { name: 'STUDENT' } },
                  select: { id: true }
                })
              ).map(u => u.id)
            }
          } : {})
        }
      })
    ]);

    const totalHighRiskAlerts = highRiskAlerts + escalationAlerts;

    // Get total published resources (articles, meditations, music therapy)
    const [totalArticles, totalMeditations, totalMusic] = await Promise.all([
      // For articles, get ALL published articles regardless of creator
      prisma.article.count({
        where: {
          status: 'PUBLISHED'
        }
      }),
      prisma.meditation.count({
        where: {
          status: 'PUBLISHED',
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
            school: {
              id: user.schoolId
            }
          } : {}),
          ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
            school: {
              id: user.schoolId
            }
          } : {})
        }
      }),
      prisma.musicTherapy.count({
        where: {
          status: 'PUBLISHED',
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
            admin: {
              schoolId: user.schoolId
            }
          } : {}),
          ...(user.role.name === 'SCHOOL_SUPERADMIN' && user.schoolId ? {
            admin: {
              schoolId: user.schoolId
            }
          } : {})
        }
      })
    ]);

    const totalResources = totalArticles + totalMeditations + totalMusic;

    // Get total schools (only for superadmin)
    let totalSchools = 0;
    if (user.role.name === 'SUPERADMIN') {
      totalSchools = await prisma.school.count();
    } else if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      totalSchools = 1; // Admin and SchoolSuperAdmin can only see their school
    }

    const metrics = {
      totalStudents,
      checkinsToday,
      activeSessions,
      highRiskAlerts: totalHighRiskAlerts, // Combined count of unresolved HighRiskAlerts and open critical/high priority EscalationAlerts
      totalResources,
      totalSchools,
      // Breakdown of resources
      resourcesBreakdown: {
        articles: totalArticles, // ALL published articles from all schools/superadmins
        meditations: totalMeditations,
        music: totalMusic
      }
    };

    return Response.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
