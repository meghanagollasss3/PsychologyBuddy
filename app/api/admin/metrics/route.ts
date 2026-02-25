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

    // Get total students
    const totalStudents = await prisma.user.count({
      where: {
        role: { name: 'STUDENT' },
        ...(user.role.name === 'ADMIN' && user.schoolId ? {
          schoolId: user.schoolId
        } : {}),
        ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
          schoolId: schoolId
        } : {})
      }
    });

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkinsToday = await prisma.moodCheckin.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        ...(user.role.name === 'ADMIN' && user.schoolId ? {
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
        ...(user.role.name === 'SUPERADMIN' && schoolId && schoolId !== 'all' ? {
          user: {
            schoolId: schoolId
          }
        } : {})
      }
    });

    // Get high-risk alerts (unresolved) - count both HighRiskAlert and EscalationAlert
    const [highRiskAlerts, escalationAlerts] = await Promise.all([
      prisma.highRiskAlert.count({
        where: {
          resolved: false,
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
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
          status: 'open', // Count open escalation alerts
          ...(user.role.name === 'ADMIN' && user.schoolId ? {
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
          } : {})
        }
      })
    ]);

    const totalResources = totalArticles + totalMeditations + totalMusic;

    // Get total schools (only for superadmin)
    let totalSchools = 0;
    if (user.role.name === 'SUPERADMIN') {
      totalSchools = await prisma.school.count();
    } else if (user.role.name === 'ADMIN') {
      totalSchools = 1; // Admin can only see their school
    }

    const metrics = {
      totalStudents,
      checkinsToday,
      activeSessions,
      highRiskAlerts: totalHighRiskAlerts, // Combined count of both alert types
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
