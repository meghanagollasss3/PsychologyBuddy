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
    console.log('Activities API: Raw URL', request.url);
    console.log('Activities API: Raw searchParams', Object.fromEntries(searchParams.entries()));
    
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const schoolId = searchParams.get('schoolId') || undefined;
    const dateRange = searchParams.get('dateRange') || undefined;
    const timeFilter = searchParams.get('timeFilter') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Activities API: Received params', {
      timeFilter,
      startDate,
      endDate,
      search,
      type,
      classId,
      schoolId,
      limit,
      offset
    });

    // Get activities with role-based filtering
    const result = await RecentActivityService.getRecentActivities(
      user.id,
      {
        search,
        type,
        classId,
        schoolId,
        dateRange,
        timeFilter,
        startDate,
        endDate,
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
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch recent activities',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
