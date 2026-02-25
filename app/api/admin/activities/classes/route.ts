import { NextResponse } from 'next/server';
import { withPermission } from '@/src/middleware/permission.middleware';
import { RecentActivityService } from '@/src/server/services/recent-activity.service';

export const GET = withPermission({ 
  module: 'ACTIVITY', 
  action: 'VIEW' 
})(async (request: any, { user }: any) => {
  try {
    // Get available classes based on admin role
    const classes = await RecentActivityService.getAvailableClasses(user.id);

    return NextResponse.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch classes',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
