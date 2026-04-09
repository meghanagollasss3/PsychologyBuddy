import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/analytics/session-engagement - Get session engagement analytics
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const url = new URL(req.url);
    const months = parseInt(url.searchParams.get('months') || '6');
    const schoolId = url.searchParams.get('schoolId');

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    console.log('Session engagement - User role:', user.role.name, 'Target school:', targetSchoolId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Generate month labels
    const monthLabels = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthLabels.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Build where clause for school filtering
    const schoolFilter = targetSchoolId ? {
      user: {
        schoolId: targetSchoolId
      }
    } : {};

    // Fetch chat sessions by month
    const chatSessions = await prisma.chatSession.groupBy({
      by: ['startedAt'],
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate
        },
        ...schoolFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        startedAt: 'asc'
      }
    });

    // Fetch mood check-ins by month
    const moodCheckins = await prisma.moodCheckin.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...schoolFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Aggregate by month
    const sessionEngagementData = monthLabels.map(month => {
      // Count sessions in this month
      const sessionsInMonth = chatSessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        return sessionDate.toISOString().slice(0, 7) === month;
      }).reduce((sum, session) => sum + session._count.id, 0);

      // Count check-ins in this month
      const checkinsInMonth = moodCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.createdAt);
        return checkinDate.toISOString().slice(0, 7) === month;
      }).reduce((sum, checkin) => sum + checkin._count.id, 0);

      return {
        month: month,
        sessions: sessionsInMonth,
        checkIns: checkinsInMonth
      };
    });

    return Response.json({
      success: true,
      data: {
        sessionEngagement: sessionEngagementData
      }
    });

  } catch (error) {
    console.error('Session engagement analytics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
