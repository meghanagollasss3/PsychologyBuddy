import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { RecentActivityService } from '@/src/server/services/recent-activity.service';

export const GET = withPermission({ 
  module: 'ACTIVITY', 
  action: 'VIEW' 
})(async (request: NextRequest, { user }: any) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = 'alert'; // Always filter for alerts
    const classId = searchParams.get('classId') || undefined;
    const schoolId = searchParams.get('schoolId') || undefined;
    const dateRange = searchParams.get('dateRange') || 'month'; // Default to month to get more data
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get alerts with role-based filtering
    const result = await RecentActivityService.getRecentActivities(
      user.id,
      {
        search,
        type,
        classId,
        schoolId,
        dateRange,
        limit,
        offset
      }
    );

    return NextResponse.json({
      success: true,
      data: result.activities,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < result.total
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch alerts',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
