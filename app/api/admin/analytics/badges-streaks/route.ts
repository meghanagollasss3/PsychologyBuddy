import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/analytics/badges-streaks - Get badges and streaks analytics
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const url = new URL(req.url);
    const weeks = parseInt(url.searchParams.get('weeks') || '6');
    const schoolId = url.searchParams.get('schoolId');

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    console.log('Badges streaks - User role:', user.role.name, 'Target school:', targetSchoolId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Generate week labels
    const weekLabels = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      weekLabels.push(`Week ${weeks - i}`);
    }

    // Build where clause for school filtering
    const schoolFilter = targetSchoolId ? {
      user: {
        schoolId: targetSchoolId
      }
    } : {};

    // Fetch badges earned (get all badges, we'll group by week in JS)
    const allBadgesEarned = await prisma.userBadge.findMany({
      where: {
        earnedAt: {
          gte: startDate,
          lte: endDate
        },
        ...schoolFilter
      },
      select: {
        earnedAt: true,
        id: true
      },
      orderBy: {
        earnedAt: 'asc'
      }
    });

    // Fetch active streaks by week (users with current streak > 0)
    // Since streaks are current state, we'll use lastActive to approximate
    const activeStreaks = await prisma.streak.groupBy({
      by: ['lastActive'],
      where: {
        count: {
          gt: 0
        },
        lastActive: {
          gte: startDate,
          lte: endDate
        },
        ...schoolFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        lastActive: 'asc'
      }
    });

    // Aggregate by week
    const badgesStreaksData = weekLabels.map((weekLabel, index) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - ((weeks - 1 - index) * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Count badges earned in this week
      const badgesInWeek = allBadgesEarned.filter(badge => {
        const badgeDate = new Date(badge.earnedAt);
        return badgeDate >= weekStart && badgeDate <= weekEnd;
      }).length;

      // Count active streaks in this week
      const streaksInWeek = activeStreaks.filter(streak => {
        const streakDate = new Date(streak.lastActive);
        return streakDate >= weekStart && streakDate <= weekEnd;
      }).reduce((sum, streak) => sum + streak._count.id, 0);

      return {
        week: weekLabel,
        badgesEarned: badgesInWeek,
        activeStreaks: streaksInWeek
      };
    });

    return Response.json({
      success: true,
      data: {
        badgesStreaks: badgesStreaksData
      }
    });

  } catch (error) {
    console.error('Badges and streaks analytics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
