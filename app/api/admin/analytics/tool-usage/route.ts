import { NextRequest } from 'next/server';
import prisma from '@/src/prisma';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';

// GET /api/admin/analytics/tool-usage - Get tool usage analytics
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

    console.log('Tool usage - User role:', user.role.name, 'Target school:', targetSchoolId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Generate month labels for the last N months
    const monthLabels = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthLabels.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Fetch journaling usage by month
    const journalingUsage = await prisma.writingJournal.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(targetSchoolId && {
          user: {
            schoolId: targetSchoolId
          }
        })
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Fetch meditation saves by month
    const meditationUsage = await prisma.meditationSave.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(targetSchoolId && {
          user: {
            schoolId: targetSchoolId
          }
        })
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Fetch music saves by month
    const musicUsage = await prisma.musicSave.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        ...(targetSchoolId && {
          user: {
            schoolId: targetSchoolId
          }
        })
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Aggregate by month
    const usageByMonth = monthLabels.map(month => {
      const journalingCount = journalingUsage
        .filter(item => item.createdAt.toISOString().slice(0, 7) === month)
        .reduce((sum, item) => sum + item._count.id, 0);

      const meditationCount = meditationUsage
        .filter(item => item.createdAt.toISOString().slice(0, 7) === month)
        .reduce((sum, item) => sum + item._count.id, 0);

      const musicCount = musicUsage
        .filter(item => item.createdAt.toISOString().slice(0, 7) === month)
        .reduce((sum, item) => sum + item._count.id, 0);

      return {
        month: month,
        journaling: journalingCount,
        meditation: meditationCount,
        music: musicCount
      };
    });

    return Response.json({
      success: true,
      data: {
        toolUsage: usageByMonth
      }
    });

  } catch (error) {
    console.error('Tool usage analytics error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
