import { NextRequest } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { handleError } from '@/src/utils/errors';
import prisma from '@/src/prisma';

// GET /api/admin/weekly-mood-distribution - Get weekly mood distribution by class
export const GET = withPermission({
  module: 'ANALYTICS',
  action: 'VIEW'
})(async (req: NextRequest, { user }: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const weeks = parseInt(searchParams.get('weeks') || '4'); // Default to last 4 weeks

    let targetSchoolId: string | undefined;

    if (user.role.name === 'ADMIN' || user.role.name === 'SCHOOL_SUPERADMIN') {
      targetSchoolId = user.schoolId;
    } else if (user.role.name === 'SUPERADMIN') {
      if (schoolId && schoolId !== 'all') {
        targetSchoolId = schoolId;
      }
    }

    console.log('User:', user);
    console.log('School ID param:', schoolId);
    console.log('Weeks param:', weeks);
    console.log('Target School ID:', targetSchoolId);

    // Calculate date range for the last N weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log('Date range:', { startDate, endDate });

    // Get all classes for the school
    const classes = await prisma.class.findMany({
      where: targetSchoolId ? { schoolId: targetSchoolId } : {},
      select: {
        id: true,
        name: true,
        grade: true,
        section: true
      },
      orderBy: [
        { grade: 'asc' },
        { section: 'asc' }
      ]
    });

    console.log('Found classes:', classes);

    // Get mood check-ins for the date range, grouped by class and mood
    const moodCheckins = await prisma.moodCheckin.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        user: {
          role: { name: 'STUDENT' },
          ...(targetSchoolId && { schoolId: targetSchoolId })
        }
      },
      include: {
        user: {
          select: {
            classId: true,
            schoolId: true
          }
        }
      }
    });

    console.log('Found mood check-ins:', moodCheckins.length);
    console.log('Sample check-in:', moodCheckins[0]);

    // Define mood categories
    const moodCategories = ['HAPPY', 'OKAY', 'SAD', 'ANXIOUS', 'TIRED', 'ANGRY', 'FRUSTRATED', 'EXCITED'];

    // Process data by class
    const weeklyMoodData = classes.map(cls => {
      const classCheckins = moodCheckins.filter(checkin => checkin.user.classId === cls.id);
      
      console.log(`Class ${cls.grade}-${cls.section} has ${classCheckins.length} check-ins`);
      
      const moodCounts = classCheckins.reduce((acc, checkin) => {
        const mood = checkin.mood.toUpperCase();
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Create class name (Grade-Section format)
      const className = `${cls.grade}-${cls.section}`;

      // Return data for this class
      const result: any = { class: className };

      // Add mood counts
      moodCategories.forEach(mood => {
        result[mood.toLowerCase()] = moodCounts[mood] || 0;
      });

      console.log(`Class data for ${className}:`, result);
      return result;
    });

    console.log('Final weeklyMoodData:', weeklyMoodData);

    // Calculate weekly averages
    const weeklyData = [];
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekCheckins = moodCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.date);
        return checkinDate >= weekStart && checkinDate <= weekEnd;
      });

      const weekMoodCounts = weekCheckins.reduce((acc, checkin) => {
        const mood = checkin.mood.toUpperCase();
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      weeklyData.push({
        week: `Week ${i + 1}`,
        ...moodCategories.reduce((acc, mood) => {
          acc[mood.toLowerCase()] = weekMoodCounts[mood] || 0;
          return acc;
        }, {} as Record<string, number>)
      });
    }

    console.log('Weekly mood distribution data:', {
      classesCount: classes.length,
      totalCheckins: moodCheckins.length,
      dateRange: { startDate, endDate },
      weeklyDataPoints: weeklyData.length
    });

    return Response.json({
      success: true,
      data: {
        weeklyMoodData,
        weeklyData,
        summary: {
          totalClasses: classes.length,
          totalCheckins: moodCheckins.length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          weeks: weeks
        }
      }
    });

  } catch (error) {
    console.error('Get weekly mood distribution error:', error);
    const errorResponse = handleError(error);
    return Response.json(errorResponse, { status: errorResponse.error?.code || 500 });
  }
});
