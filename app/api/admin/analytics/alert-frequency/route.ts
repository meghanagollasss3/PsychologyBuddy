import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/analytics/alert-frequency - Get alert frequency analytics
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const url = new URL(req.url);
    const weeks = parseInt(url.searchParams.get('weeks') || '4');
    const schoolId = url.searchParams.get('schoolId');

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    console.log('Alert frequency - User role:', user.role.name, 'Target school:', targetSchoolId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Generate week labels
    const weekLabels = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      weekLabels.push(`Week ${weeks - i}`);
    }

    // Build where clause for school filtering
    const schoolFilter = targetSchoolId ? {
      user: {
        schoolId: targetSchoolId
      }
    } : {};

    // Get total students in the school (for healthy calculation)
    const totalStudents = await prisma.user.count({
      where: {
        role: {
          name: 'STUDENT'
        },
        ...(targetSchoolId ? { schoolId: targetSchoolId } : {})
      }
    });

    // Fetch escalation alerts by week
    const escalationAlerts = await prisma.escalationAlert.groupBy({
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

    // Aggregate by week
    const alertFrequencyData = weekLabels.map((weekLabel, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - ((weeks - 1 - index) * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Count alerts in this week
      const alertsInWeek = escalationAlerts.filter(alert => {
        const alertDate = new Date(alert.createdAt);
        return alertDate >= weekStart && alertDate <= weekEnd;
      }).reduce((sum, alert) => sum + alert._count.id, 0);

      // For healthy students: total students minus students with alerts this week
      // Note: This is a simplified calculation. In a real scenario, we'd need to track
      // which specific students had alerts to get accurate healthy counts.
      // For now, we'll use a rough approximation.
      const healthyInWeek = Math.max(0, totalStudents - alertsInWeek);

      return {
        week: weekLabel,
        healthy: healthyInWeek,
        alerts: alertsInWeek
      };
    });

    return Response.json({
      success: true,
      data: {
        alertFrequency: alertFrequencyData
      }
    });

  } catch (error) {
    console.error('Alert frequency analytics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
