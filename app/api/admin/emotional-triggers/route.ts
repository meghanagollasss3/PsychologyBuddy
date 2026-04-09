import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/admin/emotional-triggers - Get emotional triggers data
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const timeRange = searchParams.get('timeRange') || 'all';

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'all':
        // For 'all', show lifetime data from the beginning
        startDate.setFullYear(2000, 0, 1); // January 1, 2000
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get trigger selections within date range
    const triggerSelections = await prisma.triggerSelection.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        user: {
          role: { name: 'STUDENT' },
          ...(targetSchoolId && { schoolId: targetSchoolId })
        }
      },
      include: {
        user: {
          select: {
            schoolId: true
          }
        }
      }
    });

    // Count triggers
    const triggerCounts = triggerSelections.reduce((acc, selection) => {
      const triggers = selection.triggers as string[];
      triggers.forEach(trigger => {
        acc[trigger] = (acc[trigger] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Transform to chart format and sort by count
    const chartData = Object.entries(triggerCounts)
      .map(([trigger, count]) => ({
        trigger: trigger.length > 20 ? trigger.substring(0, 20) + '...' : trigger,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 triggers

    console.log('Emotional triggers data:', {
      triggerCounts,
      chartData,
      totalReports: triggerSelections.length,
      timeRange
    });

    return Response.json({
      success: true,
      data: {
        chartData,
        totalReports: triggerSelections.length,
        timeRange
      }
    });

  } catch (error) {
    console.error('Get emotional triggers error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
