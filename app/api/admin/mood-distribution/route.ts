import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/admin/mood-distribution - Get mood distribution data
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

    // Calculate date range based on time filter
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
        startDate.setHours(0, 0, 0, 0);
    }

    const moodCheckins = await prisma.moodCheckin.findMany({
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

    // Count moods
    const moodCounts = moodCheckins.reduce((acc, checkin) => {
      const mood = checkin.mood;
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Define mood colors and order
    const moodColors = {
      HAPPY: { color: "hsl(142, 71%, 45%)", label: "Happy" },
      OKAY: { color: "hsl(217, 91%, 60%)", label: "Okay" },
      SAD: { color: "hsl(262, 83%, 58%)", label: "Sad" },
      ANXIOUS: { color: "hsl(38, 92%, 50%)", label: "Anxious" },
      TIRED: { color: "hsl(0, 84%, 60%)", label: "Tired" },
      ANGRY: { color: "hsl(0, 84%, 60%)", label: "Angry" },
      FRUSTRATED: { color: "hsl(15, 85%, 55%)", label: "Frustrated" },
      EXCITED: { color: "hsl(45, 95%, 55%)", label: "Excited" }
    };

    // Transform to chart format
    const totalCheckins = moodCheckins.length;
    const chartData = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        name: moodColors[mood as keyof typeof moodColors]?.label || mood,
        value: totalCheckins > 0 ? Math.round((count / totalCheckins) * 100) : 0,
        color: moodColors[mood as keyof typeof moodColors]?.color || "hsl(0, 0%, 50%)",
        count: count
      }))
      .sort((a, b) => b.value - a.value);

    console.log('Mood distribution data:', {
      moodCounts,
      chartData,
      totalCheckins,
      dominantMood: chartData.length > 0 ? chartData[0] : null,
      timeRange
    });

    return Response.json({
      success: true,
      data: {
        chartData,
        totalCheckins,
        dominantMood: chartData.length > 0 ? chartData[0] : null,
        timeRange
      }
    });

  } catch (error) {
    console.error('Get mood distribution error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
